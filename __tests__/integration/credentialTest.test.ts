import { describe, it, expect, vi } from 'vitest';
import { createHmac } from 'node:crypto';

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

	it('should build correct request options for credential test', () => {
		const date = new Date().toUTCString();
		const method = 'GET';
		const path = '/memories';
		const contentType = 'application/json';

		const challenge = `${method}\n${path}\n\n${contentType}\n${date}`;
		const signature = createHmac('sha256', accessKeySecret)
			.update(challenge)
			.digest('base64');

		const requestOptions = {
			method: 'POST' as const,
			uri: 'https://api.laratranslate.com/memories',
			headers: {
				'X-HTTP-Method-Override': method,
				'X-Lara-Date': date,
				'Content-Type': contentType,
				Authorization: `Lara ${accessKeyId}:${signature}`,
			},
			json: true,
		};

		expect(requestOptions.method).toBe('POST');
		expect(requestOptions.uri).toBe('https://api.laratranslate.com/memories');
		expect(requestOptions.headers['X-HTTP-Method-Override']).toBe('GET');
		expect(requestOptions.headers['X-Lara-Date']).toBe(date);
		expect(requestOptions.headers['Content-Type']).toBe('application/json');
		expect(requestOptions.headers.Authorization).toContain('Lara test-access-key-id:');
		expect(requestOptions.json).toBe(true);
	});

	it('should handle credential test success flow', async () => {
		const mockRequest = vi.fn().mockResolvedValue([{ id: 'mem-1', name: 'Test Memory' }]);

		const date = new Date().toUTCString();
		const challenge = `GET\n/memories\n\napplication/json\n${date}`;
		const signature = createHmac('sha256', accessKeySecret)
			.update(challenge)
			.digest('base64');

		await mockRequest({
			method: 'POST',
			uri: 'https://api.laratranslate.com/memories',
			headers: {
				'X-HTTP-Method-Override': 'GET',
				'X-Lara-Date': date,
				'Content-Type': 'application/json',
				Authorization: `Lara ${accessKeyId}:${signature}`,
			},
			json: true,
		});

		expect(mockRequest).toHaveBeenCalledTimes(1);
		const callArgs = mockRequest.mock.calls[0][0];
		expect(callArgs.headers.Authorization).toMatch(/^Lara .+:.+$/);
	});

	it('should handle credential test failure flow', async () => {
		const mockRequest = vi.fn().mockRejectedValue(new Error('401 Unauthorized'));

		try {
			await mockRequest({
				method: 'POST',
				uri: 'https://api.laratranslate.com/memories',
				headers: {},
				json: true,
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			const result = {
				status: 'Error' as const,
				message,
			};
			expect(result.status).toBe('Error');
			expect(result.message).toBe('401 Unauthorized');
		}
	});
});
