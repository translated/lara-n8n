import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LaraApiClient } from '../../nodes/LaraTranslate/services/LaraApiClient';
import LaraTranslateServices from '../../nodes/LaraTranslate/services/TranslateService';

describe('Node Integration - Full Execution Flow', () => {
	const credentials = {
		accessKeyId: 'test-key-id',
		accessKeySecret: 'test-key-secret',
	};

	describe('Text Translation Flow', () => {
		it('should execute a complete text translation workflow', async () => {
			const mockHttpRequest = vi.fn().mockResolvedValue({
				statusCode: 200,
				body: {
					content: {
						translation: 'Ciao mondo',
						source_language: 'en',
						content_type: 'text/plain',
						adapted_to: [],
						glossaries: [],
					},
				},
			});

			const lara = LaraTranslateServices.createTranslator(credentials);
			lara.setHttpRequest(mockHttpRequest);

			const result = await LaraTranslateServices.translateText({
				lara,
				text: 'Hello world',
				source: 'en',
				target: 'it',
				options: { style: 'faithful' },
			});

			expect(result).toBeDefined();
			expect(result.translation).toBe('Ciao mondo');
			expect(result.sourceLanguage).toBe('en');
			expect(result.contentType).toBe('text/plain');
			expect(mockHttpRequest).toHaveBeenCalledTimes(1);

			const callArgs = mockHttpRequest.mock.calls[0][0];
			expect(callArgs.url).toBe('https://api.laratranslate.com/translate');
			expect(callArgs.method).toBe('POST');
			expect(callArgs.headers['X-HTTP-Method-Override']).toBe('POST');
			expect(callArgs.headers.Authorization).toMatch(/^Lara test-key-id:.+$/);
			expect(callArgs.body.q).toBe('Hello world');
			expect(callArgs.body.source).toBe('en');
			expect(callArgs.body.target).toBe('it');
			expect(callArgs.body.style).toBe('faithful');
		});

		it('should handle text translation with all options', async () => {
			const mockHttpRequest = vi.fn().mockResolvedValue({
				statusCode: 200,
				body: {
					content: {
						translation: 'Translated text',
						source_language: 'en',
						content_type: 'text/plain',
					},
				},
			});

			const lara = LaraTranslateServices.createTranslator(credentials);
			lara.setHttpRequest(mockHttpRequest);

			const result = await LaraTranslateServices.translateText({
				lara,
				text: 'Hello',
				source: '',
				target: 'it',
				options: {
					style: 'fluid',
					contentType: 'text/plain',
					glossaries: ['g1'],
					adaptTo: ['m1'],
					instructions: ['Be formal'],
					useCache: true,
					cacheTtl: 3600,
					timeoutMs: 5000,
					noTrace: true,
				},
			});

			expect(result.translation).toBe('Translated text');

			const callArgs = mockHttpRequest.mock.calls[0][0];
			expect(callArgs.body.style).toBe('fluid');
			expect(callArgs.body.content_type).toBe('text/plain');
			expect(callArgs.body.glossaries).toEqual(['g1']);
			expect(callArgs.body.adapt_to).toEqual(['m1']);
			expect(callArgs.body.instructions).toEqual(['Be formal']);
			expect(callArgs.body.use_cache).toBe(true);
			expect(callArgs.body.cache_ttl).toBe(3600);
			expect(callArgs.body.timeout).toBe(5000);
			expect(callArgs.headers['X-No-Trace']).toBe('true');
		});

		it('should reject empty text', async () => {
			const lara = LaraTranslateServices.createTranslator(credentials);
			lara.setHttpRequest(vi.fn());

			await expect(
				LaraTranslateServices.translateText({
					lara,
					text: '   ',
					source: 'en',
					target: 'it',
					options: {},
				}),
			).rejects.toThrow('No text to translate');
		});

		it('should handle API errors gracefully', async () => {
			const mockHttpRequest = vi.fn().mockResolvedValue({
				statusCode: 401,
				body: {
					error: {
						type: 'AuthenticationError',
						message: 'Invalid credentials',
					},
				},
			});

			const lara = LaraTranslateServices.createTranslator(credentials);
			lara.setHttpRequest(mockHttpRequest);

			await expect(
				LaraTranslateServices.translateText({
					lara,
					text: 'Hello',
					source: 'en',
					target: 'it',
					options: {},
				}),
			).rejects.toThrow('AuthenticationError: Invalid credentials');
		});
	});

	describe('Document Translation Flow', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('should execute a complete document translation workflow', async () => {
			const translatedContent = Buffer.from('translated document content');
			let callCount = 0;

			const mockHttpRequest = vi.fn().mockImplementation((opts: any) => {
				callCount++;
				// Step 1: GET /documents/upload-url
				if (callCount === 1) {
					return Promise.resolve({
						statusCode: 200,
						body: {
							content: {
								url: 'https://s3.example.com/upload',
								fields: { key: 'doc-key', policy: 'pol', 'X-Amz-Signature': 'sig' },
							},
						},
					});
				}
				// Step 2: POST to S3 (upload)
				if (callCount === 2) {
					return Promise.resolve('');
				}
				// Step 3: POST /documents (register)
				if (callCount === 3) {
					return Promise.resolve({
						statusCode: 200,
						body: {
							content: { id: 'doc-123', status: 'initialized' },
						},
					});
				}
				// Step 4: GET /documents/doc-123 (poll - translated)
				if (callCount === 4) {
					return Promise.resolve({
						statusCode: 200,
						body: {
							content: { status: 'translated' },
						},
					});
				}
				// Step 5: GET /documents/doc-123/download-url
				if (callCount === 5) {
					return Promise.resolve({
						statusCode: 200,
						body: {
							content: { url: 'https://s3.example.com/download/translated.docx' },
						},
					});
				}
				// Step 6: GET download URL
				if (callCount === 6) {
					return Promise.resolve(translatedContent);
				}
				return Promise.reject(new Error('Unexpected call'));
			});

			const lara = LaraTranslateServices.createTranslator(credentials);
			lara.setHttpRequest(mockHttpRequest);

			const promise = LaraTranslateServices.translateDocument({
				lara,
				fileBuffer: Buffer.from('original doc'),
				documentName: 'test.docx',
				source: 'en',
				target: 'it',
				options: {},
			});

			await vi.advanceTimersByTimeAsync(2000);

			const result = await promise;

			expect(result).toBeDefined();
			expect(result.data).toBeDefined();
			expect(result.data.fileName).toBe('test.docx');
			expect(result.data.mimeType).toBe(
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			);
			expect(result.data.fileExtension).toBe('docx');
			expect(result.data.data).toBeTruthy(); // base64 encoded
			expect(mockHttpRequest).toHaveBeenCalledTimes(6);
		});

		it('should default PDF output to DOCX when no outputFormat specified', async () => {
			const translatedContent = Buffer.from('translated pdf');
			let callCount = 0;

			const mockHttpRequest = vi.fn().mockImplementation(() => {
				callCount++;
				if (callCount === 1) {
					return Promise.resolve({
						statusCode: 200,
						body: {
							content: {
								url: 'https://s3.example.com/upload',
								fields: { key: 'k' },
							},
						},
					});
				}
				if (callCount === 2) return Promise.resolve('');
				if (callCount === 3) {
					return Promise.resolve({
						statusCode: 200,
						body: { content: { id: 'doc-1', status: 'initialized' } },
					});
				}
				if (callCount === 4) {
					return Promise.resolve({
						statusCode: 200,
						body: { content: { status: 'translated' } },
					});
				}
				if (callCount === 5) {
					return Promise.resolve({
						statusCode: 200,
						body: { content: { url: 'https://s3.example.com/dl' } },
					});
				}
				if (callCount === 6) return Promise.resolve(translatedContent);
				return Promise.reject(new Error('Unexpected'));
			});

			const lara = LaraTranslateServices.createTranslator(credentials);
			lara.setHttpRequest(mockHttpRequest);

			const promise = LaraTranslateServices.translateDocument({
				lara,
				fileBuffer: Buffer.from('pdf content'),
				documentName: 'report.pdf',
				source: 'en',
				target: 'it',
				options: {},
			});

			await vi.advanceTimersByTimeAsync(2000);

			const result = await promise;

			// PDF without outputFormat defaults to DOCX
			expect(result.data.fileExtension).toBe('docx');
			expect(result.data.fileName).toBe('report.docx');
		});
	});

	describe('Load Options Flow', () => {
		it('should load glossaries from API', async () => {
			const mockHttpRequest = vi.fn().mockResolvedValue({
				statusCode: 200,
				body: {
					content: [
						{ id: 'g1', name: 'Technical' },
						{ id: 'g2', name: 'Marketing' },
					],
				},
			});

			const lara = LaraTranslateServices.createTranslator(credentials);
			lara.setHttpRequest(mockHttpRequest);

			const glossaries = await lara.listGlossaries();

			expect(glossaries).toHaveLength(2);
			expect(glossaries[0]).toEqual({ id: 'g1', name: 'Technical' });
			expect(glossaries[1]).toEqual({ id: 'g2', name: 'Marketing' });
		});

		it('should load memories from API', async () => {
			const mockHttpRequest = vi.fn().mockResolvedValue({
				statusCode: 200,
				body: {
					content: [
						{ id: 'm1', name: 'Product Docs' },
						{ id: 'm2', name: 'Website' },
					],
				},
			});

			const lara = LaraTranslateServices.createTranslator(credentials);
			lara.setHttpRequest(mockHttpRequest);

			const memories = await lara.listMemories();

			expect(memories).toHaveLength(2);
			expect(memories[0]).toEqual({ id: 'm1', name: 'Product Docs' });
		});
	});
});
