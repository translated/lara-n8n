import {
	IExecuteFunctions,
	INodeExecutionData,
	NodeOperationError,
} from 'n8n-workflow';
import { LaraTranslateAdditionalOptions } from '../types/types';
import LaraTranslateServices from '../services/TranslateService';
import { validateDocumentInputs, validateBinaryInput } from '../utils/validators';
import { createLaraError } from '../utils/utils';
import { LaraApiClient } from '../services/LaraApiClient';

/**
 * Executes document translation for a single item
 * Handles parameter extraction, validation, translation, and response formatting
 */
export async function executeDocumentTranslation(
	context: IExecuteFunctions,
	itemIndex: number,
	items: INodeExecutionData[],
	lara: LaraApiClient,
	source: string,
	target: string,
): Promise<INodeExecutionData[]> {
	const documentName = context.getNodeParameter('documentName', itemIndex) as string;
	const binaryPropertyName = context.getNodeParameter('binaryPropertyName', itemIndex) as string;
	const binaryData = items[itemIndex].binary?.[binaryPropertyName];

	validateBinaryInput(binaryData, binaryPropertyName);
	validateDocumentInputs(documentName);

	const additionalOptionsDocument = context.getNodeParameter(
		'additionalOptionsDocument',
		itemIndex,
		{},
	) as LaraTranslateAdditionalOptions;

	const additionalOptions = context.getNodeParameter(
		'additionalOptions',
		itemIndex,
		{},
	) as LaraTranslateAdditionalOptions;

	const options = {
		...additionalOptions,
		...additionalOptionsDocument,
	};

	try {
		// Use getBinaryDataBuffer to support both in-memory and filesystem binary storage
		const fileBuffer = await context.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);

		const translationBinary = await LaraTranslateServices.translateDocument({
			lara,
			fileBuffer,
			documentName,
			source,
			target,
			options,
		});

		return context.helpers.constructExecutionMetaData(
			[
				{
					json: { documentName, source, target },
					binary: translationBinary,
				},
			],
			{ itemData: { item: itemIndex } },
		);
	} catch (error) {
		throw new NodeOperationError(
			context.getNode(),
			createLaraError(error, 'document translation'),
			{ itemIndex },
		);
	}
}
