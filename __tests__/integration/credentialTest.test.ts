import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { LaraTranslateApi } from '../../credentials/LaraTranslateApi.credentials';

describe('Credential Test - HMAC-SHA256 Signing', () => {
	const accessKeyId = 'test-access-key-id';
	const accessKeySecret = 'test-access-key-secret';

	it('should produce a valid HMAC-SHA256 signature', () => {
		const method = 'GET';
		const path = '/memories';
		const contentType = 'application/json';
		const date = 'Wed, 01 Jan 2025 00:00:00 GMT';

		const challenge = `${method}\n${path}\n\n${contentType}\n${date}`;
		const signature = createHmac('sha256', accessKeySecret)
			.update(challenge)
			.digest('base64');

		expect(signature).toBeTruthy();
		expect(typeof signature).toBe('string');
		// Base64 encoded HMAC-SHA256 is always 44 chars
		expect(signature.length).toBe(44);
	});

	it('should produce different signatures for different secrets', () => {
		const challenge = 'GET\n/memories\n\napplication/json\ndate';

		const sig1 = createHmac('sha256', 'secret1').update(challenge).digest('base64');
		const sig2 = createHmac('sha256', 'secret2').update(challenge).digest('base64');

		expect(sig1).not.toBe(sig2);
	});

	it('should produce consistent signatures for same input', () => {
		const challenge = 'GET\n/memories\n\napplication/json\ndate';

		const sig1 = createHmac('sha256', accessKeySecret).update(challenge).digest('base64');
		const sig2 = createHmac('sha256', accessKeySecret).update(challenge).digest('base64');

		expect(sig1).toBe(sig2);
	});

	it('should build correct authorization header format', () => {
		const date = new Date().toUTCString();
		const method = 'GET';
		const path = '/memories';
		const contentType = 'application/json';

		const challenge = `${method}\n${path}\n\n${contentType}\n${date}`;
		const signature = createHmac('sha256', accessKeySecret)
			.update(challenge)
			.digest('base64');

		const authHeader = `Lara ${accessKeyId}:${signature}`;

		expect(authHeader).toMatch(/^Lara test-access-key-id:.{44}$/);
	});
});

describe('LaraTranslateApi credential class', () => {
	const cred = new LaraTranslateApi();

	describe('test property', () => {
		it('should define a valid test request', () => {
			expect(cred.test).toBeDefined();
			expect(cred.test!.request.url).toBe('/memories');
			expect(cred.test!.request.method).toBe('POST');
			expect(cred.test!.request.baseURL).toBe('https://api.laratranslate.com');
		});
	});

	describe('authenticate()', () => {
		it('should inject correct auth headers into request options', async () => {
			const result = await cred.authenticate(
				{ accessKeyId: 'test-key', accessKeySecret: 'test-secret' },
				{
					url: '/memories',
					method: 'POST',
					headers: {
						'X-HTTP-Method-Override': 'GET',
						'Content-Type': 'application/json',
					},
				},
			);

			expect(result.headers?.Authorization).toMatch(/^Lara test-key:.{44}$/);
			expect(result.headers?.['X-Lara-Date']).toBeDefined();
			expect(result.headers?.['X-HTTP-Method-Override']).toBe('GET');
			expect(result.headers?.['Content-Type']).toBe('application/json');
		});

		it('should use GET as default logical method when no override header', async () => {
			const result = await cred.authenticate(
				{ accessKeyId: 'key', accessKeySecret: 'secret' },
				{
					url: '/test',
					method: 'POST',
					headers: {},
				},
			);

			expect(result.headers?.Authorization).toMatch(/^Lara key:/);
			expect(result.headers?.['X-Lara-Date']).toBeDefined();
		});

		it('should produce different signatures for different credentials', async () => {
			const opts = {
				url: '/memories',
				method: 'POST' as const,
				headers: {
					'X-HTTP-Method-Override': 'GET',
					'Content-Type': 'application/json',
				},
			};

			const result1 = await cred.authenticate(
				{ accessKeyId: 'key1', accessKeySecret: 'secret1' },
				{ ...opts, headers: { ...opts.headers } },
			);
			const result2 = await cred.authenticate(
				{ accessKeyId: 'key2', accessKeySecret: 'secret2' },
				{ ...opts, headers: { ...opts.headers } },
			);

			expect(result1.headers?.Authorization).not.toBe(result2.headers?.Authorization);
		});
	});

	describe('icon', () => {
		it('should have an icon defined', () => {
			expect(cred.icon).toBe('file:LaraLogo.svg');
		});
	});
});
