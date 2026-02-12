import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NodeOperationError } from 'n8n-workflow';
import { executeDocumentTranslation } from '../../../nodes/LaraTranslate/executors/DocumentTranslationExecutor';
import { LaraApiClient } from '../../../nodes/LaraTranslate/services/LaraApiClient';

describe('executeDocumentTranslation', () => {
	let mockContext: any;
	let mockLara: {
		translate: ReturnType<typeof vi.fn>;
		translateDocument: ReturnType<typeof vi.fn>;
		setHttpRequest: ReturnType<typeof vi.fn>;
	};
	let mockItems: any[];

	beforeEach(() => {
		mockLara = {
			translate: vi.fn(),
			translateDocument: vi.fn().mockResolvedValue(Buffer.from('translated content')),
			setHttpRequest: vi.fn(),
		};

		mockItems = [
			{
				json: {},
				binary: {
					data: {
						data: Buffer.from('file content').toString('base64'),
						mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
						fileName: 'test.docx',
					},
				},
			},
		];

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
				getBinaryDataBuffer: vi.fn().mockResolvedValue(Buffer.from('file content')),
				constructExecutionMetaData: vi.fn((data, opts) => data),
			},
		};
	});

	it('returns correct shape with json and binary on successful translation', async () => {
		mockContext.getNodeParameter
			.mockReturnValueOnce('test.docx')   // documentName
			.mockReturnValueOnce('data')          // binaryPropertyName
			.mockReturnValueOnce({})              // additionalOptionsDocument
			.mockReturnValueOnce({});             // additionalOptions

		const result = await executeDocumentTranslation(
			mockContext,
			0,
			mockItems,
			mockLara as unknown as LaraApiClient,
			'en',
			'it',
		);

		expect(result).toHaveLength(1);
		expect(result[0]).toHaveProperty('json');
		expect(result[0]).toHaveProperty('binary');
		expect(result[0].json).toEqual({
			documentName: 'test.docx',
			source: 'en',
			target: 'it',
		});
		expect(result[0].binary).toHaveProperty('data');
		expect(result[0].binary!.data).toHaveProperty('mimeType');
		expect(result[0].binary!.data).toHaveProperty('fileName');
	});

	it('calls getBinaryDataBuffer with correct arguments', async () => {
		mockContext.getNodeParameter
			.mockReturnValueOnce('test.docx')
			.mockReturnValueOnce('data')
			.mockReturnValueOnce({})
			.mockReturnValueOnce({});

		await executeDocumentTranslation(
			mockContext,
			0,
			mockItems,
			mockLara as unknown as LaraApiClient,
			'en',
			'it',
		);

		expect(mockContext.helpers.getBinaryDataBuffer).toHaveBeenCalledWith(0, 'data');
	});

	it('calls constructExecutionMetaData with correct itemData', async () => {
		mockContext.getNodeParameter
			.mockReturnValueOnce('test.docx')
			.mockReturnValueOnce('data')
			.mockReturnValueOnce({})
			.mockReturnValueOnce({});

		await executeDocumentTranslation(
			mockContext,
			0,
			mockItems,
			mockLara as unknown as LaraApiClient,
			'en',
			'it',
		);

		expect(mockContext.helpers.constructExecutionMetaData).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({
					json: expect.any(Object),
					binary: expect.any(Object),
				}),
			]),
			{ itemData: { item: 0 } },
		);
	});

	it('validates that binary data exists', async () => {
		mockContext.getNodeParameter
			.mockReturnValueOnce('test.docx')
			.mockReturnValueOnce('missing_property');

		const itemsWithoutBinary = [{ json: {}, binary: {} }];

		await expect(
			executeDocumentTranslation(
				mockContext,
				0,
				itemsWithoutBinary,
				mockLara as unknown as LaraApiClient,
				'en',
				'it',
			),
		).rejects.toThrow();
	});

	it('validates that binary data property has data field', async () => {
		mockContext.getNodeParameter
			.mockReturnValueOnce('test.docx')
			.mockReturnValueOnce('data');

		const itemsWithEmptyBinary = [
			{
				json: {},
				binary: {
					data: { mimeType: 'application/pdf' }, // missing .data field
				},
			},
		];

		await expect(
			executeDocumentTranslation(
				mockContext,
				0,
				itemsWithEmptyBinary,
				mockLara as unknown as LaraApiClient,
				'en',
				'it',
			),
		).rejects.toThrow();
	});

	it('validates document name is not empty', async () => {
		mockContext.getNodeParameter
			.mockReturnValueOnce('')                // empty documentName
			.mockReturnValueOnce('data');

		await expect(
			executeDocumentTranslation(
				mockContext,
				0,
				mockItems,
				mockLara as unknown as LaraApiClient,
				'en',
				'it',
			),
		).rejects.toThrow();
	});

	it('validates document name has a supported extension', async () => {
		mockContext.getNodeParameter
			.mockReturnValueOnce('test.xyz123')     // unsupported extension
			.mockReturnValueOnce('data');

		await expect(
			executeDocumentTranslation(
				mockContext,
				0,
				mockItems,
				mockLara as unknown as LaraApiClient,
				'en',
				'it',
			),
		).rejects.toThrow();
	});

	it('throws NodeOperationError on API failure', async () => {
		mockContext.getNodeParameter
			.mockReturnValueOnce('test.docx')
			.mockReturnValueOnce('data')
			.mockReturnValueOnce({})
			.mockReturnValueOnce({});

		mockLara.translateDocument.mockRejectedValueOnce(new Error('Server error'));

		await expect(
			executeDocumentTranslation(
				mockContext,
				0,
				mockItems,
				mockLara as unknown as LaraApiClient,
				'en',
				'it',
			),
		).rejects.toThrow(NodeOperationError);
	});

	it('includes error context in NodeOperationError message', async () => {
		mockContext.getNodeParameter
			.mockReturnValueOnce('test.docx')
			.mockReturnValueOnce('data')
			.mockReturnValueOnce({})
			.mockReturnValueOnce({});

		mockLara.translateDocument.mockRejectedValueOnce(new Error('Timeout'));

		try {
			await executeDocumentTranslation(
				mockContext,
				0,
				mockItems,
				mockLara as unknown as LaraApiClient,
				'en',
				'it',
			);
			expect.fail('Should have thrown');
		} catch (error) {
			expect(error).toBeInstanceOf(NodeOperationError);
			expect((error as NodeOperationError).message).toContain('document translation');
		}
	});

	it('merges additionalOptionsDocument and additionalOptions', async () => {
		mockContext.getNodeParameter
			.mockReturnValueOnce('test.docx')
			.mockReturnValueOnce('data')
			.mockReturnValueOnce({ adaptTo: ['mem-1'] })           // additionalOptionsDocument
			.mockReturnValueOnce({ style: 'faithful' });           // additionalOptions

		await executeDocumentTranslation(
			mockContext,
			0,
			mockItems,
			mockLara as unknown as LaraApiClient,
			'en',
			'it',
		);

		expect(mockLara.translateDocument).toHaveBeenCalledTimes(1);
		// The options go through OptionsProcessor then to translateDocument
		const callArgs = mockLara.translateDocument.mock.calls[0];
		expect(callArgs).toBeDefined();
	});
});
