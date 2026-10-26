import { describe, it, expect, vi, beforeEach } from 'vitest';

// The real config ships placeholders (metrics off). Point them at a fake
// endpoint so the whole delivery path runs.
vi.mock('../../nodes/LaraTranslate/config/metricsConfig', async (importOriginal) => {
	const original = await importOriginal<
		typeof import('../../nodes/LaraTranslate/config/metricsConfig')
	>();
	return { ...original, METRICS_URL: 'https://metrics.test', METRICS_API_KEY: 'channel-key' };
});

import { IExecuteFunctions } from 'n8n-workflow';
import { LaraTranslate } from '../../nodes/LaraTranslate/LaraTranslate.node';
import { resetMetricsState } from '../../nodes/LaraTranslate/services/metrics';
import { ACCOUNT_ID, laraToken } from '../helpers/lara';

const TRANSLATION_OK = {
	statusCode: 200,
	body: { content: { translation: 'Ciao mondo', source_language: 'en', content_type: 'text/plain' } },
};

interface Routes {
	translate?: unknown;
	metrics?: (url: string) => unknown;
}

/**
 * One httpRequest mock for both hosts: the node passes the same helper to the
 * Lara client and to the metrics module.
 */
function httpRequestMock(routes: Routes) {
	return vi.fn().mockImplementation(async (options: { url: string }) => {
		const { url } = options;
		if (url.startsWith('https://metrics.test')) {
			if (!routes.metrics) throw new Error('unexpected metrics call');
			const result = routes.metrics(url);
			return result instanceof Error ? Promise.reject(result) : result;
		}
		if (url.endsWith('/v2/auth')) {
			return { statusCode: 200, body: { token: laraToken() } };
		}
		const translate = routes.translate ?? TRANSLATION_OK;
		if (translate instanceof Error) throw translate;
		return translate;
	});
}

function metricsOk(url: string) {
	if (url.endsWith('/auth/issue-token')) {
		return { statusCode: 200, body: { status: 'success', token: 'jwt', expiresIn: 3600 } };
	}
	return { statusCode: 202, body: { status: 'success', accepted: 1 } };
}

function executionContext(
	httpRequest: ReturnType<typeof vi.fn>,
	params: Record<string, unknown> = {},
	continueOnFail = false,
): IExecuteFunctions {
	const allParams: Record<string, unknown> = {
		resource: 'translation',
		operation: 'translateText',
		target: 'it',
		source: 'en',
		text: 'Hello world',
		additionalOptions: {},
		additionalOptionsText: {},
		...params,
	};

	return {
		getInputData: () => [{ json: {} }],
		getNodeParameter: (name: string, _itemIndex: number, fallback?: unknown) =>
			name in allParams ? allParams[name] : fallback,
		getCredentials: async () => ({ accessKeyId: 'test-key-id', accessKeySecret: 'test-secret' }),
		getNode: () => ({
			id: 'node-1',
			name: 'Lara Translate',
			type: 'laraTranslate',
			typeVersion: 1,
			position: [0, 0] as [number, number],
			parameters: {},
		}),
		getInstanceId: () => 'instance-abc',
		getExecutionId: () => 'execution-1',
		isToolExecution: () => false,
		continueOnFail: () => continueOnFail,
		helpers: {
			httpRequest,
			constructExecutionMetaData: (data: unknown) => data,
		},
	} as unknown as IExecuteFunctions;
}

function ingestedEvents(httpRequest: ReturnType<typeof vi.fn>) {
	const call = httpRequest.mock.calls.find((args) =>
		String(args[0].url).endsWith('/metrics/ingest-events'),
	);
	return call ? (call[0].body.events as Array<Record<string, unknown>>) : undefined;
}

describe('Metrics Integration - Node Execution', () => {
	beforeEach(() => {
		resetMetricsState();
		vi.clearAllMocks();
	});

	it('should report install and a successful call after a text translation', async () => {
		const httpRequest = httpRequestMock({ metrics: metricsOk });

		const result = await LaraTranslate.prototype.execute.call(executionContext(httpRequest));

		expect(result[0][0]).toMatchObject({ json: { translation: 'Ciao mondo' } });

		const events = ingestedEvents(httpRequest);
		expect(events?.map((event) => event.eventType)).toEqual([
			'install',
			'auth_success',
			'call_success',
		]);

		const call = events?.[2] as Record<string, unknown>;
		expect(call.accountId).toBe(ACCOUNT_ID);
		expect(call.channel).toBe('n8n');
		expect(call.charsTranslated).toBe('Hello world'.length);
		expect(typeof call.latencyMs).toBe('number');
		expect(call.metadata).toEqual({
			feature: 'text',
			surface: 'node',
			sourceLang: 'en',
			targetLang: 'it',
		});
	});

	it('should omit the character count in incognito mode', async () => {
		const httpRequest = httpRequestMock({ metrics: metricsOk });

		await LaraTranslate.prototype.execute.call(
			executionContext(httpRequest, { additionalOptions: { noTrace: true } }),
		);

		const call = ingestedEvents(httpRequest)?.find((event) => event.eventType === 'call_success');
		expect(call?.charsTranslated).toBeUndefined();
	});

	it('should report call_error on the fail-fast path', async () => {
		const httpRequest = httpRequestMock({
			metrics: metricsOk,
			translate: { statusCode: 500, body: { error: { type: 'ServerError', message: 'boom' } } },
		});

		await expect(
			LaraTranslate.prototype.execute.call(executionContext(httpRequest)),
		).rejects.toThrow();

		const events = ingestedEvents(httpRequest);
		const failure = events?.find((event) => event.eventType === 'call_error');
		expect(failure).toBeDefined();
		expect(failure?.errorType).toBe('server_5xx');
		expect(failure?.accountId).toBe(ACCOUNT_ID);
	});

	it('should report auth_fail when the key is rejected', async () => {
		const httpRequest = httpRequestMock({
			metrics: metricsOk,
			translate: { statusCode: 401, body: { error: { type: 'AuthError', message: 'nope' } } },
		});

		await expect(
			LaraTranslate.prototype.execute.call(executionContext(httpRequest, {}, true)),
		).resolves.toBeDefined();

		const types = ingestedEvents(httpRequest)?.map((event) => event.eventType);
		expect(types).toContain('auth_fail');
		expect(types).toContain('call_error');
	});

	it.each(['connect ECONNREFUSED 127.0.0.1:8080', 'timeout of 2000ms exceeded'])(
		'should still translate when metrics delivery fails with %s',
		async (message) => {
			const httpRequest = httpRequestMock({ metrics: () => new Error(message) });

			const result = await LaraTranslate.prototype.execute.call(executionContext(httpRequest));

			expect(result[0][0]).toMatchObject({ json: { translation: 'Ciao mondo' } });
		},
	);

	it('should send nothing when the credential opts out', async () => {
		const httpRequest = httpRequestMock({ metrics: metricsOk });
		const context = executionContext(httpRequest);
		context.getCredentials = (async () => ({
			accessKeyId: 'test-key-id',
			accessKeySecret: 'test-secret',
			sendUsageMetrics: false,
		})) as IExecuteFunctions['getCredentials'];

		await LaraTranslate.prototype.execute.call(context);

		const metricsCalls = httpRequest.mock.calls.filter((args) =>
			String(args[0].url).startsWith('https://metrics.test'),
		);
		expect(metricsCalls).toHaveLength(0);
	});
});
