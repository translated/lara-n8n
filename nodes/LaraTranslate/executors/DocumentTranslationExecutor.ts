import {
	IBinaryData,
	IExecuteFunctions,
	INodeExecutionData,
	NodeOperationError,
} from 'n8n-workflow';
import { LaraTranslateAdditionalOptions } from '../types/types';
import { InputSource } from '../types/enums';
import LaraTranslateServices from '../services/TranslateService';
import { validateDocumentInputs, validateBinaryInput, validateFilePath } from '../utils/validators';
import { createLaraError } from '../utils/utils';
import { Translator } from '@translated/lara';

/**
 * Executes document translation for a single item
 * Handles parameter extraction, validation, translation, and response formatting
 */
export async function executeDocumentTranslation(
	context: IExecuteFunctions,
	itemIndex: number,
	items: INodeExecutionData[],
	lara: Translator,
	source: string,
	target: string,
): Promise<INodeExecutionData[]> {
	const inputSource = context.getNodeParameter('inputSource', itemIndex) as string;
	const documentName = context.getNodeParameter('documentName', itemIndex) as string;

	let documentPath: string | undefined;
	let binaryData: IBinaryData | undefined;

	// Handle different input sources
	if (inputSource === InputSource.PATH) {
		documentPath = context.getNodeParameter('documentPath', itemIndex) as string;
		validateFilePath(documentPath);
		validateDocumentInputs(documentName, documentPath);
	} else if (inputSource === InputSource.BINARY) {
		const binaryPropertyName = context.getNodeParameter('binaryPropertyName', itemIndex) as string;
		binaryData = items[itemIndex].binary?.[binaryPropertyName];
		validateBinaryInput(binaryData, binaryPropertyName);
		validateDocumentInputs(documentName);
	}

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
		const response = await LaraTranslateServices.translateDocument({
			lara,
			documentPath,
			binaryData,
			documentName,
			source,
			target,
			options,
		});

		return context.helpers.constructExecutionMetaData(
			[
				{
					json: {...response},
					binary: response.translationBinary,
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
