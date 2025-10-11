import { IExecuteFunctions, INodeExecutionData, NodeOperationError } from 'n8n-workflow';
import { LaraTranslateAdditionalOptions } from '../types/types';
import LaraTranslateServices from '../services/TranslateService';
import { validateTextInput } from '../utils/validators';
import { createLaraError } from '../utils/utils';
import { Translator } from '@translated/lara';

/**
 * Executes text translation for a single item
 * Handles parameter extraction, validation, translation, and response formatting
 */
export async function executeTextTranslation(
	context: IExecuteFunctions,
	itemIndex: number,
	lara: Translator,
	source: string,
	target: string,
): Promise<INodeExecutionData[]> {
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

		return context.helpers.constructExecutionMetaData(
			[
				{
					json: {...response},
				},
			],
			{ itemData: { item: itemIndex } },
		);
	} catch (error) {
		throw new NodeOperationError(context.getNode(), createLaraError(error, 'text translation'), {
			itemIndex,
		});
	}
}
