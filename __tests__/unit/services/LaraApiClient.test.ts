import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LaraApiClient } from '../../../nodes/LaraTranslate/services/LaraApiClient';

describe('LaraApiClient', () => {
	let client: LaraApiClient;
	let mockHttpRequest: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		client = new LaraApiClient('test-key-id', 'test-key-secret');
		mockHttpRequest = vi.fn();
		client.setHttpRequest(mockHttpRequest);
	});

	describe('translate()', () => {
		it('calls httpRequest with correct URL, headers, and body', async () => {
			mockHttpRequest.mockResolvedValueOnce({
				statusCode: 200,
				body: {
					content: {
						translation: 'Ciao',
						source_language: 'en',
						content_type: 'text/plain',
					},
				},
			});

			await client.translate('Hello', 'en', 'it', {});

			expect(mockHttpRequest).toHaveBeenCalledTimes(1);

			const callArgs = mockHttpRequest.mock.calls[0][0];
			expect(callArgs.url).toBe('https://api.laratranslate.com/translate');
			expect(callArgs.method).toBe('POST');
			expect(callArgs.headers['X-HTTP-Method-Override']).toBe('POST');
			expect(callArgs.headers['X-Lara-Date']).toBeDefined();
			expect(callArgs.headers['Authorization']).toMatch(/^Lara test-key-id:.+$/);
			expect(callArgs.headers['Content-MD5']).toBeDefined();
			expect(callArgs.body.q).toBe('Hello');
			expect(callArgs.body.source).toBe('en');
			expect(callArgs.body.target).toBe('it');
			expect(callArgs.body.multiline).toBe(true);
			expect(callArgs.returnFullResponse).toBe(true);
			expect(callArgs.ignoreHttpStatusErrors).toBe(true);
			expect(callArgs.json).toBe(true);
		});

		it('sets X-No-Trace header when noTrace option is true', async () => {
			mockHttpRequest.mockResolvedValueOnce({
				statusCode: 200,
				body: {
					content: {
						translation: 'Ciao',
						source_language: 'en',
						content_type: 'text/plain',
					},
				},
			});

			await client.translate('Hello', 'en', 'it', { noTrace: true });

			const callArgs = mockHttpRequest.mock.calls[0][0];
			expect(callArgs.headers['X-No-Trace']).toBe('true');
		});

		it('does not set X-No-Trace header when noTrace is not set', async () => {
			mockHttpRequest.mockResolvedValueOnce({
				statusCode: 200,
				body: {
					content: {
						translation: 'Ciao',
						source_language: 'en',
						content_type: 'text/plain',
					},
				},
			});

			await client.translate('Hello', 'en', 'it', {});

			const callArgs = mockHttpRequest.mock.calls[0][0];
			expect(callArgs.headers['X-No-Trace']).toBeUndefined();
		});

		it('parses snake_case response keys to camelCase', async () => {
			mockHttpRequest.mockResolvedValueOnce({
				statusCode: 200,
				body: {
					content: {
						translation: 'Ciao mondo',
						source_language: 'en',
						content_type: 'text/plain',
						adapted_to: ['mem-1'],
						adapted_to_matches: [
							{
								memory: 'mem-1',
								language: ['en', 'it'],
								sentence: 'Hello',
								translation: 'Ciao',
								score: 0.95,
							},
						],
					},
				},
			});

			const result = await client.translate('Hello world', 'en', 'it', {});

			expect(result).toEqual({
				translation: 'Ciao mondo',
				sourceLanguage: 'en',
				contentType: 'text/plain',
				adaptedTo: ['mem-1'],
				adaptedToMatches: [
					{
						memory: 'mem-1',
						language: ['en', 'it'],
						sentence: 'Hello',
						translation: 'Ciao',
						score: 0.95,
					},
				],
			});
		});

		it('throws on HTTP 401 error', async () => {
			mockHttpRequest.mockResolvedValueOnce({
				statusCode: 401,
				body: {
					error: {
						type: 'AuthenticationError',
						message: 'Invalid credentials',
					},
				},
			});

			await expect(
				client.translate('Hello', 'en', 'it', {}),
			).rejects.toThrow('AuthenticationError: Invalid credentials');
		});

		it('throws on HTTP 500 error with unknown error format', async () => {
			mockHttpRequest.mockResolvedValueOnce({
				statusCode: 500,
				body: {
					error: {},
				},
			});

			await expect(
				client.translate('Hello', 'en', 'it', {}),
			).rejects.toThrow('UnknownError: HTTP 500');
		});

		it('throws on non-JSON error response', async () => {
			mockHttpRequest.mockResolvedValueOnce({
				statusCode: 502,
				body: 'Bad Gateway',
			});

			await expect(
				client.translate('Hello', 'en', 'it', {}),
			).rejects.toThrow('ApiError: HTTP 502 - Bad Gateway');
		});

		it('maps camelCase options to snake_case body params', async () => {
			mockHttpRequest.mockResolvedValueOnce({
				statusCode: 200,
				body: {
					content: {
						translation: 'Ciao',
						source_language: 'en',
						content_type: 'text/plain',
					},
				},
			});

			await client.translate('Hello', 'en', 'it', {
				contentType: 'text/html',
				adaptTo: ['mem-1'],
				useCache: true,
				cacheTtl: 3600,
				glossaries: ['gloss-1'],
				instructions: ['be formal'],
				style: 'faithful',
				timeoutMs: 5000,
			});

			const callArgs = mockHttpRequest.mock.calls[0][0];
			expect(callArgs.body.content_type).toBe('text/html');
			expect(callArgs.body.adapt_to).toEqual(['mem-1']);
			expect(callArgs.body.use_cache).toBe(true);
			expect(callArgs.body.cache_ttl).toBe(3600);
			expect(callArgs.body.glossaries).toEqual(['gloss-1']);
			expect(callArgs.body.instructions).toEqual(['be formal']);
			expect(callArgs.body.style).toBe('faithful');
			expect(callArgs.body.timeout).toBe(5000);
		});
	});

	describe('translateDocument()', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('follows the full 6-step document translation flow', async () => {
			const fileBuffer = Buffer.from('fake file content');
			const downloadedBuffer = Buffer.from('translated content');

			// Step 1: GET /documents/upload-url
			mockHttpRequest.mockResolvedValueOnce({
				statusCode: 200,
				body: {
					content: {
						url: 'https://s3.example.com/upload',
						fields: { key: 's3-key-123', policy: 'abc' },
					},
				},
			});

			// Step 2: POST to S3 (multipart upload)
			mockHttpRequest.mockResolvedValueOnce('OK');

			// Step 3: POST /documents (register document)
			mockHttpRequest.mockResolvedValueOnce({
				statusCode: 200,
				body: {
					content: {
						id: 'doc-456',
						status: 'initialized',
					},
				},
			});

			// Step 4: GET /documents/{id} (poll - first call: translating)
			mockHttpRequest.mockResolvedValueOnce({
				statusCode: 200,
				body: {
					content: {
						status: 'translating',
					},
				},
			});

			// Step 4: GET /documents/{id} (poll - second call: translated)
			mockHttpRequest.mockResolvedValueOnce({
				statusCode: 200,
				body: {
					content: {
						status: 'translated',
					},
				},
			});

			// Step 5: GET /documents/{id}/download-url
			mockHttpRequest.mockResolvedValueOnce({
				statusCode: 200,
				body: {
					content: {
						url: 'https://s3.example.com/download/translated.docx',
					},
				},
			});

			// Step 6: GET download URL
			mockHttpRequest.mockResolvedValueOnce(downloadedBuffer);

			const promise = client.translateDocument(
				fileBuffer,
				'test.docx',
				'en',
				'it',
				{ adaptTo: ['mem-1'], style: 'faithful' },
			);

			// Advance past first poll (returns 'translating')
			await vi.advanceTimersByTimeAsync(2000);
			// Advance past second poll (returns 'translated')
			await vi.advanceTimersByTimeAsync(2000);

			const result = await promise;

			expect(result).toEqual(downloadedBuffer);
			expect(mockHttpRequest).toHaveBeenCalledTimes(7);

			// Verify Step 1: upload URL request
			const step1 = mockHttpRequest.mock.calls[0][0];
			expect(step1.url).toBe('https://api.laratranslate.com/documents/upload-url');
			expect(step1.headers['X-HTTP-Method-Override']).toBe('GET');

			// Verify Step 2: S3 upload
			const step2 = mockHttpRequest.mock.calls[1][0];
			expect(step2.url).toBe('https://s3.example.com/upload');
			expect(step2.method).toBe('POST');
			expect(step2.headers['Content-Type']).toMatch(/^multipart\/form-data; boundary=/);

			// Verify Step 3: register document
			const step3 = mockHttpRequest.mock.calls[2][0];
			expect(step3.url).toBe('https://api.laratranslate.com/documents');
			expect(step3.headers['X-HTTP-Method-Override']).toBe('POST');
			expect(step3.body.source).toBe('en');
			expect(step3.body.target).toBe('it');
			expect(step3.body.s3key).toBe('s3-key-123');
			expect(step3.body.adapt_to).toEqual(['mem-1']);
			expect(step3.body.style).toBe('faithful');

			// Verify Step 5: download URL request
			const step5 = mockHttpRequest.mock.calls[5][0];
			expect(step5.url).toBe('https://api.laratranslate.com/documents/doc-456/download-url');

			// Verify Step 6: actual download
			const step6 = mockHttpRequest.mock.calls[6][0];
			expect(step6.url).toBe('https://s3.example.com/download/translated.docx');
			expect(step6.method).toBe('GET');
			expect(step6.encoding).toBe('arraybuffer');
		});

		it('throws on document error status', async () => {
			const fileBuffer = Buffer.from('fake file content');

			// Step 1: upload URL
			mockHttpRequest.mockResolvedValueOnce({
				statusCode: 200,
				body: {
					content: {
						url: 'https://s3.example.com/upload',
						fields: { key: 's3-key-123', policy: 'abc' },
					},
				},
			});

			// Step 2: S3 upload
			mockHttpRequest.mockResolvedValueOnce('OK');

			// Step 3: register document
			mockHttpRequest.mockResolvedValueOnce({
				statusCode: 200,
				body: {
					content: {
						id: 'doc-789',
						status: 'initialized',
					},
				},
			});

			// Step 4: poll - returns error
			mockHttpRequest.mockResolvedValueOnce({
				statusCode: 200,
				body: {
					content: {
						status: 'error',
						error_reason: 'Unsupported file format',
					},
				},
			});

			const promise = client.translateDocument(fileBuffer, 'test.docx', 'en', 'it', {});

			// Attach rejection handler before advancing timers to avoid unhandled rejection
			const expectation = expect(promise).rejects.toThrow('DocumentError: Unsupported file format');

			await vi.advanceTimersByTimeAsync(2000);

			await expectation;
		});

		it('sets X-No-Trace header on document registration when noTrace is true', async () => {
			const fileBuffer = Buffer.from('fake file content');
			const downloadedBuffer = Buffer.from('translated');

			// Step 1
			mockHttpRequest.mockResolvedValueOnce({
				statusCode: 200,
				body: { content: { url: 'https://s3.example.com/upload', fields: { key: 'k1' } } },
			});
			// Step 2
			mockHttpRequest.mockResolvedValueOnce('OK');
			// Step 3
			mockHttpRequest.mockResolvedValueOnce({
				statusCode: 200,
				body: { content: { id: 'doc-1', status: 'initialized' } },
			});
			// Step 4 - translated immediately
			mockHttpRequest.mockResolvedValueOnce({
				statusCode: 200,
				body: { content: { status: 'translated' } },
			});
			// Step 5
			mockHttpRequest.mockResolvedValueOnce({
				statusCode: 200,
				body: { content: { url: 'https://s3.example.com/dl' } },
			});
			// Step 6
			mockHttpRequest.mockResolvedValueOnce(downloadedBuffer);

			const promise = client.translateDocument(fileBuffer, 'test.docx', 'en', 'it', { noTrace: true });

			await vi.advanceTimersByTimeAsync(2000);

			await promise;

			// Step 3 call should have X-No-Trace
			const step3 = mockHttpRequest.mock.calls[2][0];
			expect(step3.headers['X-No-Trace']).toBe('true');
		});
	});

	describe('listGlossaries()', () => {
		it('calls the correct endpoint and returns parsed response', async () => {
			mockHttpRequest.mockResolvedValueOnce({
				statusCode: 200,
				body: {
					content: [
						{ id: 'gloss-1', name: 'Technical Glossary' },
						{ id: 'gloss-2', name: 'Marketing Glossary' },
					],
				},
			});

			const result = await client.listGlossaries();

			expect(result).toEqual([
				{ id: 'gloss-1', name: 'Technical Glossary' },
				{ id: 'gloss-2', name: 'Marketing Glossary' },
			]);

			const callArgs = mockHttpRequest.mock.calls[0][0];
			expect(callArgs.url).toBe('https://api.laratranslate.com/glossaries');
			expect(callArgs.headers['X-HTTP-Method-Override']).toBe('GET');
		});
	});

	describe('listMemories()', () => {
		it('calls the correct endpoint and returns parsed response', async () => {
			mockHttpRequest.mockResolvedValueOnce({
				statusCode: 200,
				body: {
					content: [
						{ id: 'mem-1', name: 'Product Memory' },
					],
				},
			});

			const result = await client.listMemories();

			expect(result).toEqual([
				{ id: 'mem-1', name: 'Product Memory' },
			]);

			const callArgs = mockHttpRequest.mock.calls[0][0];
			expect(callArgs.url).toBe('https://api.laratranslate.com/memories');
			expect(callArgs.headers['X-HTTP-Method-Override']).toBe('GET');
		});
	});

	describe('httpRequest not set', () => {
		it('throws if any method is called without setHttpRequest()', async () => {
			const freshClient = new LaraApiClient('key-id', 'key-secret');

			await expect(
				freshClient.translate('Hello', 'en', 'it', {}),
			).rejects.toThrow('LaraApiClient: httpRequest not set. Call setHttpRequest() before making API calls.');
		});

		it('throws for listGlossaries without setHttpRequest()', async () => {
			const freshClient = new LaraApiClient('key-id', 'key-secret');

			await expect(
				freshClient.listGlossaries(),
			).rejects.toThrow('LaraApiClient: httpRequest not set');
		});

		it('throws for listMemories without setHttpRequest()', async () => {
			const freshClient = new LaraApiClient('key-id', 'key-secret');

			await expect(
				freshClient.listMemories(),
			).rejects.toThrow('LaraApiClient: httpRequest not set');
		});
	});
});
