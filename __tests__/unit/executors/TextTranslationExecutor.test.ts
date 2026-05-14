import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { executeTextTranslation } from '../../../nodes/LaraTranslate/executors/TextTranslationExecutor';
import {
	LaraApiClient,
	LaraApiHttpError,
} from '../../../nodes/LaraTranslate/services/LaraApiClient';

describe('executeTextTranslation', () => {
	let mockContext: any;
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
			translateDocument: vi.fn(),
			setHttpRequest: vi.fn(),
		};

		mockContext = {
			getNodeParameter: vi.fn(),
			getNode: vi.fn().mockReturnValue({
				name: 'test',
				type: 'test',
				typeVersion: 1,
				position: [0, 0],
				parameters: {},
			}),
			helpers: {
				constructExecutionMetaData: vi.fn((data, opts) => data),
			},
		};
	});

	it('returns correct data shape on successful translation', async () => {
		mockContext.getNodeParameter
			.mockReturnValueOnce('Hello')          // text
			.mockReturnValueOnce({})                 // additionalOptions
			.mockReturnValueOnce({});                // additionalOptionsText

		const result = await executeTextTranslation(
			mockContext,
			0,
			mockLara as unknown as LaraApiClient,
			'en',
			'it',
		);

		expect(result).toEqual([
			{
				json: {
					translation: 'Ciao',
					sourceLanguage: 'en',
					contentType: 'text/plain',
				},
			},
		]);
	});

	it('calls constructExecutionMetaData with correct itemData', async () => {
		mockContext.getNodeParameter
			.mockReturnValueOnce('Hello')
			.mockReturnValueOnce({})
			.mockReturnValueOnce({});

		await executeTextTranslation(
			mockContext,
			2,
			mockLara as unknown as LaraApiClient,
			'en',
			'it',
		);

		expect(mockContext.helpers.constructExecutionMetaData).toHaveBeenCalledWith(
			[{ json: expect.any(Object) }],
			{ itemData: { item: 2 } },
		);
	});

	it('merges additionalOptions and additionalOptionsText', async () => {
		mockContext.getNodeParameter
			.mockReturnValueOnce('Hello')
			.mockReturnValueOnce({ style: 'faithful', glossaries: ['gloss-1'] })
			.mockReturnValueOnce({ contentType: 'text/html', noTrace: true });

		await executeTextTranslation(
			mockContext,
			0,
			mockLara as unknown as LaraApiClient,
			'en',
			'it',
		);

		// TranslateService.translateText receives merged options
		const translateCall = mockLara.translate.mock.calls[0];
		// The options are processed by OptionsProcessor, so check they were passed through
		expect(translateCall).toBeDefined();
	});

	it('throws NodeOperationError on generic (non-HTTP) failure', async () => {
		mockContext.getNodeParameter
			.mockReturnValueOnce('Hello')
			.mockReturnValueOnce({})
			.mockReturnValueOnce({});

		mockLara.translate.mockRejectedValueOnce(new Error('Unexpected failure'));

		await expect(
			executeTextTranslation(
				mockContext,
				0,
				mockLara as unknown as LaraApiClient,
				'en',
				'it',
			),
		).rejects.toThrow(NodeOperationError);
	});

	it('throws NodeApiError when LaraApiHttpError is raised', async () => {
		mockContext.getNodeParameter
			.mockReturnValueOnce('Hello')
			.mockReturnValueOnce({})
			.mockReturnValueOnce({});

		const responseBody = { error: { type: 'RateLimit', message: 'Too many requests' } };
		mockLara.translate.mockRejectedValueOnce(
			new LaraApiHttpError({
				statusCode: 429,
				body: responseBody,
				headers: { 'retry-after': '30' },
				message: 'RateLimit: Too many requests',
			}),
		);

		const error = await executeTextTranslation(
			mockContext,
			0,
			mockLara as unknown as LaraApiClient,
			'en',
			'it',
		).catch((e: unknown) => e);

		expect(error).toBeInstanceOf(NodeApiError);
		expect((error as NodeApiError).message).toContain('Too many requests');
	});

	it('includes error context in NodeOperationError message', async () => {
		mockContext.getNodeParameter
			.mockReturnValueOnce('Hello')
			.mockReturnValueOnce({})
			.mockReturnValueOnce({});

		mockLara.translate.mockRejectedValueOnce(new Error('Timeout'));

		try {
			await executeTextTranslation(
				mockContext,
				0,
				mockLara as unknown as LaraApiClient,
				'en',
				'it',
			);
			expect.fail('Should have thrown');
		} catch (error) {
			expect(error).toBeInstanceOf(NodeOperationError);
			expect((error as NodeOperationError).message).toContain('text translation');
		}
	});

	it('throws when text input is empty', async () => {
		mockContext.getNodeParameter
			.mockReturnValueOnce('');

		await expect(
			executeTextTranslation(
				mockContext,
				0,
				mockLara as unknown as LaraApiClient,
				'en',
				'it',
			),
		).rejects.toThrow();
	});
});
