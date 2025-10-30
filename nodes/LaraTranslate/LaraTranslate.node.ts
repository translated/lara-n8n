import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

import {
	genericAdvancedOptions,
	translateDocumentFields,
	translateFields,
	translateOperations,
	translateTextFields,
} from './config/nodeDescription';
import LaraTranslateServices from './services/TranslateService';
import { validateLanguages } from './utils/validators';
import { getErrorMessage } from './utils/utils';
import { executeTextTranslation } from './executors/TextTranslationExecutor';
import { executeDocumentTranslation } from './executors/DocumentTranslationExecutor';

export class LaraTranslate implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Lara Translate',
		name: 'laraTranslate',
		icon: 'file:LaraLogo.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Translate text or document using Lara Translate',
		defaults: {
			name: 'Lara Translate',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'laraTranslateApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Translation',
						value: 'translation',
					},
				],
				default: 'translation',
			},
			...translateOperations,
			...translateFields,
			...translateDocumentFields,
			...translateTextFields,
			genericAdvancedOptions,
		],
	};

	methods = {
		loadOptions: {
			async getGlossaries(this: ILoadOptionsFunctions) {
				try {
					const credentials = await this.getCredentials('laraTranslateApi');
					const lara = LaraTranslateServices.getOrCreateTranslator(credentials);
					const glossaries = await lara.glossaries.list();
					return glossaries.map((g) => ({
						name: g.name,
						value: g.id,
					}));
				} catch (error) {
					console.error('[LaraTranslate] Failed to load glossaries:', error);
					return [
						{
							name: 'Error Loading Glossaries - Check Credentials',
							value: '',
						},
					];
				}
			},

			async getMemories(this: ILoadOptionsFunctions) {
				try {
					const credentials = await this.getCredentials('laraTranslateApi');
					const lara = LaraTranslateServices.getOrCreateTranslator(credentials);
					const memories = await lara.memories.list();
					return memories.map((m) => ({
						name: m.name,
						value: m.id,
					}));
				} catch (error) {
					console.error('[LaraTranslate] Failed to load translation memories:', error);
					return [
						{
							name: 'Error Loading Memories - Check Credentials',
							value: '',
						},
					];
				}
			},

			async getLanguages(this: ILoadOptionsFunctions) {
				try {
					const langs = await LaraTranslateServices.getSupportedLanguages();
					return langs;
				} catch (error) {
					console.error('[LaraTranslate] Failed to load languages:', error);
					return [
						{
							name: 'Error Loading Languages - Check Credentials',
							value: '',
						},
					];
				}
			},

			async getLanguagesWithAuto(this: ILoadOptionsFunctions) {
				try {
					const langs = await LaraTranslateServices.getSupportedLanguages();
					return [
						{
							name: 'Autodetect',
							value: '',
							description: 'Autodetect the source language (default option)',
						},
						...langs,
					];
				} catch (error) {
					console.error('[LaraTranslate] Failed to load languages with autodetect:', error);
					return [
						{
							name: 'Error Loading Languages - Check Credentials',
							value: '',
						},
					];
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const inputItems = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Validate resource and operation (same for all items)
		const resource = this.getNodeParameter('resource', 0);
		if (!resource || resource !== 'translation') {
			throw new NodeOperationError(
				this.getNode(),
				new Error(`Resource is required and must be 'translation'`),
				{
					itemIndex: 0,
				},
			);
		}

		const operation = this.getNodeParameter('operation', 0) as string;
		if (!operation || (operation !== 'translateText' && operation !== 'translateDocument')) {
			throw new NodeOperationError(
				this.getNode(),
				new Error(
					`Operation is required and must be either 'translateText' or 'translateDocument'`,
				),
				{
					itemIndex: 0,
				},
			);
		}

		// Initialize Lara Translate API once per execution
		const credentials = await this.getCredentials('laraTranslateApi');
		const lara = LaraTranslateServices.getOrCreateTranslator(credentials);

		for (let i = 0; i < inputItems.length; i++) {
			try {
				// Get common parameters
				const target = this.getNodeParameter('target', i) as string;
				const source = this.getNodeParameter('source', i) as string;
				validateLanguages([source, target]);

				if (operation === 'translateText') {
					const executionData = await executeTextTranslation(this, i, lara, source, target);
					returnData.push(...executionData);
				} else {
					const executionData = await executeDocumentTranslation(
						this,
						i,
						inputItems,
						lara,
						source,
						target,
					);
					returnData.push(...executionData);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const executionErrorData = this.helpers.constructExecutionMetaData(
						[{ json: { error: getErrorMessage(error) } }],
						{ itemData: { item: i } },
					);
					returnData.push(...executionErrorData);
					continue;
				}

				// Re-throw as NodeOperationError if not already
				if (error instanceof NodeOperationError) {
					throw error;
				}

				throw new NodeOperationError(this.getNode(), error as Error, {
					itemIndex: i,
				});
			}
		}

		return [returnData];
	}
}
