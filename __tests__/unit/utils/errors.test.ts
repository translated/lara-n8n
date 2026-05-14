import { describe, it, expect } from 'vitest';
import { NodeApiError } from 'n8n-workflow';
import {
	buildContinueOnFailJson,
	wrapLaraHttpError,
} from '../../../nodes/LaraTranslate/utils/errors';
import { LaraApiHttpError } from '../../../nodes/LaraTranslate/services/LaraApiClient';

const node = {
	id: 'node-1',
	name: 'Lara',
	type: 'laraTranslate',
	typeVersion: 1,
	position: [0, 0] as [number, number],
	parameters: {},
};

describe('wrapLaraHttpError', () => {
	it('returns a NodeApiError carrying the HTTP code', () => {
		const httpError = new LaraApiHttpError(
			429,
			{ error: { type: 'RateLimit', message: 'Slow down' } },
			{ 'retry-after': '5' },
			'RateLimit: Slow down',
		);

		const wrapped = wrapLaraHttpError(node, 2, httpError);

		expect(wrapped).toBeInstanceOf(NodeApiError);
		expect(wrapped.httpCode).toBe('429');
		expect(wrapped.message).toContain('Slow down');
	});
});

describe('buildContinueOnFailJson', () => {
	it('extracts HTTP context from a raw LaraApiHttpError', () => {
		const httpError = new LaraApiHttpError(
			401,
			{ error: { type: 'AuthenticationError', message: 'Invalid credentials' } },
			{ 'x-request-id': 'abc' },
			'AuthenticationError: Invalid credentials',
		);

		const json = buildContinueOnFailJson(httpError);

		expect(json).toEqual({
			error: 'AuthenticationError: Invalid credentials',
			statusCode: 401,
			body: { error: { type: 'AuthenticationError', message: 'Invalid credentials' } },
			headers: { 'x-request-id': 'abc' },
		});
	});

	it('unwraps HTTP context from a NodeApiError that was built from a LaraApiHttpError', () => {
		const httpError = new LaraApiHttpError(
			500,
			{ error: { type: 'ServerError', message: 'boom' } },
			{},
			'ServerError: boom',
		);
		const wrapped = wrapLaraHttpError(node, 0, httpError);

		const json = buildContinueOnFailJson(wrapped);

		expect(json.statusCode).toBe(500);
		expect(json.body).toEqual({ error: { type: 'ServerError', message: 'boom' } });
		expect(json.error).toContain('boom');
	});

	it('falls back to a flat error message for non-HTTP failures', () => {
		const json = buildContinueOnFailJson(new Error('Invalid input'));

		expect(json).toEqual({ error: 'Invalid input' });
	});

	it('handles non-Error values gracefully', () => {
		const json = buildContinueOnFailJson('some string failure');

		expect(json).toEqual({ error: 'some string failure' });
	});
});
