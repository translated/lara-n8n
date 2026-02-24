import { describe, it, expect, vi, beforeEach } from 'vitest';
import LaraTranslateServices from '../../../nodes/LaraTranslate/services/TranslateService';
import { LaraApiClient } from '../../../nodes/LaraTranslate/services/LaraApiClient';

describe('LaraTranslateServices', () => {
	describe('createTranslator()', () => {
		it('returns a LaraApiClient with valid credentials', () => {
			const translator = LaraTranslateServices.createTranslator({
				accessKeyId: 'test-key-id',
				accessKeySecret: 'test-key-secret',
			});

			expect(translator).toBeInstanceOf(LaraApiClient);
		});

		it('throws with missing accessKeyId', () => {
			expect(() =>
				LaraTranslateServices.createTranslator({
					accessKeySecret: 'test-key-secret',
				}),
			).toThrow('Missing credentials: accessKeyId or accessKeySecret');
		});

		it('throws with missing accessKeySecret', () => {
			expect(() =>
				LaraTranslateServices.createTranslator({
					accessKeyId: 'test-key-id',
				}),
			).toThrow('Missing credentials: accessKeyId or accessKeySecret');
		});

		it('throws with empty credentials', () => {
			expect(() =>
				LaraTranslateServices.createTranslator({}),
			).toThrow('Missing credentials: accessKeyId or accessKeySecret');
		});
	});

	describe('getSupportedLanguages()', () => {
		it('returns a non-empty array', () => {
			const languages = LaraTranslateServices.getSupportedLanguages();
			expect(languages.length).toBeGreaterThan(0);
		});

		it('each entry has name, value, and description', () => {
			const languages = LaraTranslateServices.getSupportedLanguages();
			for (const lang of languages) {
				expect(lang).toHaveProperty('name');
				expect(lang).toHaveProperty('value');
				expect(lang).toHaveProperty('description');
				expect(typeof lang.name).toBe('string');
				expect(typeof lang.value).toBe('string');
				expect(typeof lang.description).toBe('string');
			}
		});

		it('includes English as a supported language', () => {
			const languages = LaraTranslateServices.getSupportedLanguages();
			const english = languages.find((l) => l.value === 'en');
			expect(english).toBeDefined();
			expect(english!.name).toBe('English');
		});
	});

	describe('isSupportedLanguage()', () => {
		it('returns true for "en"', () => {
			expect(LaraTranslateServices.isSupportedLanguage('en')).toBe(true);
		});

		it('returns false for "invalid"', () => {
			expect(LaraTranslateServices.isSupportedLanguage('invalid')).toBe(false);
		});

		it('returns false for empty string', () => {
			expect(LaraTranslateServices.isSupportedLanguage('')).toBe(false);
		});
	});

	describe('isExtensionSupported()', () => {
		it('returns true for "pdf"', () => {
			expect(LaraTranslateServices.isExtensionSupported('pdf')).toBe(true);
		});

		it('returns true for "docx"', () => {
			expect(LaraTranslateServices.isExtensionSupported('docx')).toBe(true);
		});

		it('returns true for uppercase "PDF" (case-insensitive)', () => {
			expect(LaraTranslateServices.isExtensionSupported('PDF')).toBe(true);
		});

		it('returns false for "xyz123"', () => {
			expect(LaraTranslateServices.isExtensionSupported('xyz123')).toBe(false);
		});
	});

	describe('getFileExtension()', () => {
		it('extracts extension from filename', () => {
			expect(LaraTranslateServices.getFileExtension('document.pdf')).toBe('pdf');
		});

		it('extracts extension from path with directories', () => {
			expect(LaraTranslateServices.getFileExtension('/path/to/file.docx')).toBe('docx');
		});

		it('returns empty string for files without extension', () => {
			expect(LaraTranslateServices.getFileExtension('noextension')).toBe('');
		});
	});

	describe('translateText()', () => {
		let mockLara: {
			translate: ReturnType<typeof vi.fn>;
			translateDocument: ReturnType<typeof vi.fn>;
			setHttpRequest: ReturnType<typeof vi.fn>;
		};

		beforeEach(() => {
			mockLara = {
				translate: vi.fn().mockResolvedValue({
					translation: 'Ciao',
					sourceLanguage: 'en',
					contentType: 'text/plain',
				}),
				translateDocument: vi.fn().mockResolvedValue(Buffer.from('translated')),
				setHttpRequest: vi.fn(),
			};
		});

		it('calls lara.translate and returns the result', async () => {
			const result = await LaraTranslateServices.translateText({
				lara: mockLara as unknown as LaraApiClient,
				text: 'Hello',
				source: 'en',
				target: 'it',
				options: {},
			});

			expect(mockLara.translate).toHaveBeenCalledTimes(1);
			expect(result).toEqual({
				translation: 'Ciao',
				sourceLanguage: 'en',
				contentType: 'text/plain',
			});
		});

		it('passes processed options to lara.translate', async () => {
			await LaraTranslateServices.translateText({
				lara: mockLara as unknown as LaraApiClient,
				text: 'Hello',
				source: 'en',
				target: 'it',
				options: {
					style: 'faithful',
					glossaries: ['gloss-1'],
					adaptTo: ['mem-1'],
				},
			});

			const calledOptions = mockLara.translate.mock.calls[0][3];
			expect(calledOptions.style).toBe('faithful');
			expect(calledOptions.glossaries).toEqual(['gloss-1']);
			expect(calledOptions.adaptTo).toEqual(['mem-1']);
		});

		it('throws on empty text', async () => {
			await expect(
				LaraTranslateServices.translateText({
					lara: mockLara as unknown as LaraApiClient,
					text: '',
					source: 'en',
					target: 'it',
					options: {},
				}),
			).rejects.toThrow('Text to translate cannot be empty');
		});

		it('throws on whitespace-only text', async () => {
			await expect(
				LaraTranslateServices.translateText({
					lara: mockLara as unknown as LaraApiClient,
					text: '   ',
					source: 'en',
					target: 'it',
					options: {},
				}),
			).rejects.toThrow('Text to translate cannot be empty');
		});
	});

	describe('translateDocument()', () => {
		let mockLara: {
			translate: ReturnType<typeof vi.fn>;
			translateDocument: ReturnType<typeof vi.fn>;
			setHttpRequest: ReturnType<typeof vi.fn>;
		};

		beforeEach(() => {
			mockLara = {
				translate: vi.fn(),
				translateDocument: vi.fn().mockResolvedValue(Buffer.from('translated content')),
				setHttpRequest: vi.fn(),
			};
		});

		it('calls lara.translateDocument and returns binary response', async () => {
			const result = await LaraTranslateServices.translateDocument({
				lara: mockLara as unknown as LaraApiClient,
				fileBuffer: Buffer.from('original content'),
				documentName: 'test.docx',
				source: 'en',
				target: 'it',
				options: {},
			});

			expect(mockLara.translateDocument).toHaveBeenCalledTimes(1);
			expect(result).toHaveProperty('data');
			expect(result.data).toHaveProperty('mimeType');
			expect(result.data).toHaveProperty('fileName');
			expect(result.data).toHaveProperty('data');
			expect(result.data.fileName).toBe('test.docx');
			expect(result.data.mimeType).toBe(
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			);
			expect(result.data.fileExtension).toBe('docx');
		});

		it('defaults PDF without outputFormat to docx extension', async () => {
			const result = await LaraTranslateServices.translateDocument({
				lara: mockLara as unknown as LaraApiClient,
				fileBuffer: Buffer.from('pdf content'),
				documentName: 'report.pdf',
				source: 'en',
				target: 'it',
				options: {},
			});

			expect(result.data.fileName).toBe('report.docx');
			expect(result.data.fileExtension).toBe('docx');
			expect(result.data.mimeType).toBe(
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			);
		});

		it('keeps PDF extension when outputFormat is set to pdf', async () => {
			const result = await LaraTranslateServices.translateDocument({
				lara: mockLara as unknown as LaraApiClient,
				fileBuffer: Buffer.from('pdf content'),
				documentName: 'report.pdf',
				source: 'en',
				target: 'it',
				options: { outputFormat: 'pdf' as any },
			});

			expect(result.data.fileName).toBe('report.pdf');
			expect(result.data.fileExtension).toBe('pdf');
			expect(result.data.mimeType).toBe('application/pdf');
		});

		it('returns base64-encoded data string', async () => {
			const translatedContent = Buffer.from('translated content');
			mockLara.translateDocument.mockResolvedValueOnce(translatedContent);

			const result = await LaraTranslateServices.translateDocument({
				lara: mockLara as unknown as LaraApiClient,
				fileBuffer: Buffer.from('original'),
				documentName: 'test.docx',
				source: 'en',
				target: 'it',
				options: {},
			});

			expect(result.data.data).toBe(translatedContent.toString('base64'));
		});

		it('passes correct arguments to lara.translateDocument', async () => {
			const fileBuffer = Buffer.from('content');

			await LaraTranslateServices.translateDocument({
				lara: mockLara as unknown as LaraApiClient,
				fileBuffer,
				documentName: 'report.xlsx',
				source: 'en',
				target: 'de',
				options: { adaptTo: ['mem-1'], style: 'fluid' },
			});

			expect(mockLara.translateDocument).toHaveBeenCalledWith(
				fileBuffer,
				'report.xlsx',
				'en',
				'de',
				expect.objectContaining({
					adaptTo: ['mem-1'],
					style: 'fluid',
				}),
			);
		});
	});
});
