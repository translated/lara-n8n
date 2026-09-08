import { IExecuteFunctions, INodeExecutionData, NodeOperationError } from 'n8n-workflow';
import { LaraTranslateAdditionalOptions } from '../types/types';
import LaraTranslateServices from '../services/TranslateService';
import { validateTextInput } from '../utils/validators';
import { createLaraError } from '../utils/utils';
import { wrapLaraHttpError } from '../utils/errors';
import { LaraApiClient, LaraApiHttpError } from '../services/LaraApiClient';

export interface TextTranslationResult {
	data: INodeExecutionData[];
	/**
	 * Characters submitted for translation, for usage metrics. Absent in
	 * incognito mode: asking Lara not to retain the content and then counting its
	 * characters would go against that expectation.
	 */
	charsTranslated?: number;
}

/**
 * Executes text translation for a single item
 * Handles parameter extraction, validation, translation, and response formatting
 */
export async function executeTextTranslation(
	context: IExecuteFunctions,
	itemIndex: number,
	lara: LaraApiClient,
	source: string,
	target: string,
): Promise<TextTranslationResult> {
	const text = context.getNodeParameter('text', itemIndex) as string;
	validateTextInput(text);

	const additionalOptions = context.getNodeParameter(
		'additionalOptions',
		itemIndex,
		{},
	) as LaraTranslateAdditionalOptions;

	const additionalOptionsText = context.getNodeParameter(
		'additionalOptionsText',
		itemIndex,
		{},
	) as LaraTranslateAdditionalOptions;

	const options = {
		...additionalOptions,
		...additionalOptionsText,
	};

	try {
		const response = await LaraTranslateServices.translateText({
			lara,
			text,
			source,
			target,
			options,
		});

		return {
			data: context.helpers.constructExecutionMetaData(
				[
					{
						json: { ...response },
					},
				],
				{ itemData: { item: itemIndex } },
			),
			charsTranslated: options.noTrace ? undefined : text.length,
		};
	} catch (error) {
		if (error instanceof LaraApiHttpError) {
			throw wrapLaraHttpError(context.getNode(), itemIndex, error);
		}
		throw new NodeOperationError(context.getNode(), createLaraError(error, 'text translation'), {
			itemIndex,
		});
	}
}
