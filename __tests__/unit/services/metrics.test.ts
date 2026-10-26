import { describe, it, expect, vi, beforeEach } from 'vitest';

// The real config ships placeholders (metrics off). Point them at a fake
// endpoint so the delivery path can be exercised.
vi.mock('../../../nodes/LaraTranslate/config/metricsConfig', async (importOriginal) => {
	const original = await importOriginal<
		typeof import('../../../nodes/LaraTranslate/config/metricsConfig')
	>();
	return { ...original, METRICS_URL: 'https://metrics.test', METRICS_API_KEY: 'channel-key' };
});

import { PACKAGE_VERSION } from '../../../nodes/LaraTranslate/config/clientHeaders';
import { LaraApiHttpError } from '../../../nodes/LaraTranslate/services/LaraApiClient';
import {
	createMetricsContext,
	errorTypeFor,
	recordEvent,
	resetMetricsState,
	sendEvents,
	MetricsContext,
} from '../../../nodes/LaraTranslate/services/metrics';
import { ACCOUNT_ID } from '../../helpers/lara';

const accountLookup = (accountId: string | undefined) => async () => accountId;

function context(overrides: Record<string, unknown> = {}): MetricsContext {
	return createMetricsContext('instance-abc', overrides, 'execution-1') as MetricsContext;
}

function tokenResponse(expiresIn = 3600) {
	return { statusCode: 200, body: { status: 'success', token: 'jwt-token', expiresIn } };
}

function ingestResponse(statusCode = 202, headers?: Record<string, unknown>) {
	return { statusCode, body: { status: 'success', accepted: 1 }, headers };
}

describe('metrics', () => {
	beforeEach(() => {
		resetMetricsState();
		vi.clearAllMocks();
	});

	describe('createMetricsContext()', () => {
		it('should build a context when the endpoint is baked in and no opt-out is set', () => {
			expect(context()).toMatchObject({ sessionId: 'execution-1', events: [] });
			expect(context().installationId).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
			);
		});

		it('should keep metrics on when the credential predates the opt-out field', () => {
			expect(context({ accessKeyId: 'k' })).toBeDefined();
		});

		it('should disable metrics when the credential opts out', () => {
			expect(createMetricsContext('instance-abc', { sendUsageMetrics: false }, 'e')).toBeUndefined();
		});

		it('should disable metrics when the instance is not identifiable', () => {
			expect(createMetricsContext('', {}, 'execution-1')).toBeUndefined();
		});
	});

	describe('recordEvent()', () => {
		it('should stamp the channel envelope on every event', () => {
			const ctx = context();
			recordEvent(ctx, 'call_success', {
				latencyMs: 412,
				charsTranslated: 11,
				feature: 'text',
				surface: 'node',
				sourceLang: 'EN',
				targetLang: 'IT',
			});

			expect(ctx.events).toHaveLength(1);
			const event = ctx.events[0];
			expect(event.eventType).toBe('call_success');
			expect(event.channel).toBe('n8n');
			expect(event.channelVersion).toBe(PACKAGE_VERSION);
			expect(event.sessionId).toBe('execution-1');
			expect(event.eventId).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
			);
			expect(event.latencyMs).toBe(412);
			expect(event.charsTranslated).toBe(11);
			expect(event.metadata).toEqual({
				feature: 'text',
				surface: 'node',
				sourceLang: 'en',
				targetLang: 'it',
			});
		});

		it('should record an empty source language as auto', () => {
			const ctx = context();
			recordEvent(ctx, 'call_success', { feature: 'text', sourceLang: '', targetLang: 'it' });
			expect(ctx.events[0].metadata?.sourceLang).toBe('auto');
		});

		it('should truncate language values that are not real locale codes', () => {
			const ctx = context();
			recordEvent(ctx, 'call_error', { feature: 'text', targetLang: 'x'.repeat(5000) });
			expect(ctx.events[0].metadata?.targetLang).toHaveLength(16);
		});

		it('should ignore non-string language values', () => {
			const ctx = context();
			recordEvent(ctx, 'call_error', { feature: 'text', targetLang: { nope: true } });
			expect(ctx.events[0].metadata?.targetLang).toBeUndefined();
		});

		it('should emit install only once per process', () => {
			const first = context();
			const second = context();
			recordEvent(first, 'install');
			recordEvent(second, 'install');

			expect(first.events).toHaveLength(1);
			expect(second.events).toHaveLength(0);
		});

		it('should emit each auth outcome once per process', () => {
			const ctx = context();
			recordEvent(ctx, 'auth_success');
			recordEvent(ctx, 'auth_success');

			expect(ctx.events.map((event) => event.eventType)).toEqual(['auth_success']);
		});

		it('should still report a rejection after an earlier success', () => {
			const ctx = context();
			recordEvent(ctx, 'auth_success');
			recordEvent(ctx, 'auth_fail', { errorType: 'auth_401' });

			expect(ctx.events.map((event) => event.eventType)).toEqual(['auth_success', 'auth_fail']);
		});

		it('should clamp latency to uint32', () => {
			const ctx = context();
			recordEvent(ctx, 'call_success', { latencyMs: 9_999_999_999, feature: 'text' });
			expect(ctx.events[0].latencyMs).toBe(4294967295);
		});
	});

	describe('errorTypeFor()', () => {
		it.each([
			[400, 'validation_error'],
			[401, 'auth_401'],
			[402, 'payment_402'],
			[403, 'auth_403'],
			[422, 'validation_error'],
			[429, 'rate_limit_429'],
			[503, 'server_5xx'],
		])('should map HTTP %i to %s', (statusCode, expected) => {
			const error = new LaraApiHttpError({
				statusCode,
				body: {},
				headers: undefined,
				message: 'boom',
			});
			expect(errorTypeFor(error)).toBe(expected);
		});

		it('should unwrap a Lara error carried as a cause', () => {
			const wrapped = new Error('wrapped');
			(wrapped as { cause?: unknown }).cause = new LaraApiHttpError({
				statusCode: 401,
				body: {},
				headers: undefined,
				message: 'unauthorized',
			});
			expect(errorTypeFor(wrapped)).toBe('auth_401');
		});

		it('should classify network and timeout failures', () => {
			expect(errorTypeFor(new Error('connect ECONNREFUSED 127.0.0.1:8080'))).toBe('network_error');
			expect(errorTypeFor(new Error('Request timed out'))).toBe('timeout');
			expect(errorTypeFor('something else')).toBe('unknown');
		});
	});

	describe('sendEvents()', () => {
		it('should issue a token and post the batch', async () => {
			const httpRequest = vi
				.fn()
				.mockResolvedValueOnce(tokenResponse())
				.mockResolvedValueOnce(ingestResponse());
			const ctx = context();
			recordEvent(ctx, 'call_success', { feature: 'text' });

			await sendEvents(httpRequest, ctx, accountLookup(ACCOUNT_ID));

			const tokenCall = httpRequest.mock.calls[0][0];
			expect(tokenCall.url).toBe('https://metrics.test/auth/issue-token');
			expect(tokenCall.headers.Authorization).toBe('Bearer channel-key');
			expect(tokenCall.body.installationId).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
			);
			expect(tokenCall.timeout).toBe(2000);

			const ingestCall = httpRequest.mock.calls[1][0];
			expect(ingestCall.url).toBe('https://metrics.test/metrics/ingest-events');
			expect(ingestCall.headers.Authorization).toBe('Bearer jwt-token');
			expect(ingestCall.body.events).toHaveLength(1);
			expect(ingestCall.body.events[0].accountId).toBe(ACCOUNT_ID);
			expect(ingestCall.timeout).toBe(2000);
		});

		it('should reuse a cached token across executions', async () => {
			const httpRequest = vi
				.fn()
				.mockResolvedValueOnce(tokenResponse())
				.mockResolvedValue(ingestResponse());

			const first = context();
			recordEvent(first, 'call_success', { feature: 'text' });
			await sendEvents(httpRequest, first, accountLookup(ACCOUNT_ID));

			const second = context();
			recordEvent(second, 'call_success', { feature: 'document' });
			await sendEvents(httpRequest, second, accountLookup(ACCOUNT_ID));

			const tokenCalls = httpRequest.mock.calls.filter((call) =>
				String(call[0].url).endsWith('/auth/issue-token'),
			);
			expect(tokenCalls).toHaveLength(1);
		});

		it('should share one in-flight token request across concurrent executions', async () => {
			const httpRequest = vi.fn().mockImplementation(async (options: { url: string }) => {
				if (options.url.endsWith('/auth/issue-token')) return tokenResponse();
				return ingestResponse();
			});

			const first = context();
			const second = context();
			recordEvent(first, 'call_success', { feature: 'text' });
			recordEvent(second, 'call_success', { feature: 'text' });

			await Promise.all([
				sendEvents(httpRequest, first, accountLookup(ACCOUNT_ID)),
				sendEvents(httpRequest, second, accountLookup(ACCOUNT_ID)),
			]);

			const tokenCalls = httpRequest.mock.calls.filter((call) =>
				String(call[0].url).endsWith('/auth/issue-token'),
			);
			expect(tokenCalls).toHaveLength(1);
		});

		it('should refresh the token once on 401 and retry', async () => {
			const httpRequest = vi
				.fn()
				.mockResolvedValueOnce(tokenResponse())
				.mockResolvedValueOnce({ statusCode: 401, body: {} })
				.mockResolvedValueOnce(tokenResponse())
				.mockResolvedValueOnce(ingestResponse());
			const ctx = context();
			recordEvent(ctx, 'call_success', { feature: 'text' });

			await sendEvents(httpRequest, ctx, accountLookup(ACCOUNT_ID));

			expect(httpRequest).toHaveBeenCalledTimes(4);
		});

		it('should go quiet after a 429 on ingest', async () => {
			const httpRequest = vi
				.fn()
				.mockResolvedValueOnce(tokenResponse())
				.mockResolvedValueOnce(ingestResponse(429, { 'retry-after': '30' }));
			const first = context();
			recordEvent(first, 'call_success', { feature: 'text' });
			await sendEvents(httpRequest, first, accountLookup(ACCOUNT_ID));

			httpRequest.mockClear();
			const second = context();
			recordEvent(second, 'call_success', { feature: 'text' });
			await sendEvents(httpRequest, second, accountLookup(ACCOUNT_ID));

			expect(httpRequest).not.toHaveBeenCalled();
		});

		it('should stop trying after three consecutive failures', async () => {
			const httpRequest = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

			for (let i = 0; i < 3; i++) {
				const ctx = context();
				recordEvent(ctx, 'call_success', { feature: 'text' });
				await sendEvents(httpRequest, ctx, accountLookup(ACCOUNT_ID));
			}
			expect(httpRequest).toHaveBeenCalledTimes(3);

			httpRequest.mockClear();
			const ctx = context();
			recordEvent(ctx, 'call_success', { feature: 'text' });
			await sendEvents(httpRequest, ctx, accountLookup(ACCOUNT_ID));
			expect(httpRequest).not.toHaveBeenCalled();
		});

		it('should drop events that require an account id when it is unknown', async () => {
			const httpRequest = vi
				.fn()
				.mockResolvedValueOnce(tokenResponse())
				.mockResolvedValueOnce(ingestResponse());
			const ctx = context();
			recordEvent(ctx, 'install');
			recordEvent(ctx, 'auth_fail', { errorType: 'auth_401' });
			recordEvent(ctx, 'call_error', { feature: 'text', errorType: 'auth_401' });

			await sendEvents(httpRequest, ctx, accountLookup(undefined));

			const sent = httpRequest.mock.calls[1][0].body.events;
			expect(sent.map((event: { eventType: string }) => event.eventType)).toEqual([
				'install',
				'auth_fail',
			]);
		});

		it('should send nothing when only account-bound events remain and the id is unknown', async () => {
			const httpRequest = vi.fn();
			const ctx = context();
			recordEvent(ctx, 'call_success', { feature: 'text' });

			await sendEvents(httpRequest, ctx, accountLookup(undefined));

			expect(httpRequest).not.toHaveBeenCalled();
		});

		it('should cap the batch at the server limit', async () => {
			const httpRequest = vi
				.fn()
				.mockResolvedValueOnce(tokenResponse())
				.mockResolvedValueOnce(ingestResponse());
			const ctx = context();
			for (let i = 0; i < 1200; i++) {
				recordEvent(ctx, 'call_success', { feature: 'text' });
			}

			await sendEvents(httpRequest, ctx, accountLookup(ACCOUNT_ID));

			expect(httpRequest.mock.calls[1][0].body.events).toHaveLength(1000);
		});

		it('should do nothing when metrics are off or the queue is empty', async () => {
			const httpRequest = vi.fn();
			await sendEvents(httpRequest, context(), accountLookup(ACCOUNT_ID));
			await sendEvents(httpRequest, undefined, accountLookup(ACCOUNT_ID));

			expect(httpRequest).not.toHaveBeenCalled();
		});

		it('should never throw when delivery fails', async () => {
			const httpRequest = vi.fn().mockRejectedValue(new Error('boom'));
			const ctx = context();
			recordEvent(ctx, 'call_success', { feature: 'text' });

			await expect(sendEvents(httpRequest, ctx, accountLookup(ACCOUNT_ID))).resolves.toBeUndefined();
		});
	});
});
