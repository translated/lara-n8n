import {
	ICredentialTestFunctions,
	ICredentialsDecrypted,
	ICredentialDataDecryptedObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeCredentialTestResult,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';
import { createHmac } from 'node:crypto';

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
		credentialTest: {
			async laraApiCredentialTest(
				this: ICredentialTestFunctions,
				credential: ICredentialsDecrypted<ICredentialDataDecryptedObject>,
			): Promise<INodeCredentialTestResult> {
				try {
					const { accessKeyId, accessKeySecret } = credential.data as {
						accessKeyId: string;
						accessKeySecret: string;
					};

					const method = 'GET';
					const path = '/memories';
					const contentType = 'application/json';
					const date = new Date().toUTCString();
					const challenge = `${method}\n${path}\n\n${contentType}\n${date}`;
					const signature = createHmac('sha256', accessKeySecret)
						.update(challenge)
						.digest('base64');

					await this.helpers.request({
						method: 'POST',
						uri: 'https://api.laratranslate.com/memories',
						headers: {
							'X-HTTP-Method-Override': method,
							'X-Lara-Date': date,
							'Content-Type': contentType,
							Authorization: `Lara ${accessKeyId}:${signature}`,
						},
						json: true,
					});

					return {
						status: 'OK',
						message: 'Connection successful!',
					};
				} catch (error) {
					return {
						status: 'Error',
						message: getErrorMessage(error),
					};
				}
			},
		},
		loadOptions: {
			async getGlossaries(this: ILoadOptionsFunctions) {
				try {
					const credentials = await this.getCredentials('laraTranslateApi');
					const lara = LaraTranslateServices.createTranslator(credentials);
					lara.setHttpRequest(this.helpers.httpRequest.bind(this.helpers));
					const glossaries = await lara.listGlossaries();
					return glossaries.map((g) => ({
						name: g.name,
						value: g.id,
					}));
				} catch (error) {
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
					const lara = LaraTranslateServices.createTranslator(credentials);
					lara.setHttpRequest(this.helpers.httpRequest.bind(this.helpers));
					const memories = await lara.listMemories();
					return memories.map((m) => ({
						name: m.name,
						value: m.id,
					}));
				} catch (error) {
					return [
						{
							name: 'Error Loading Memories - Check Credentials',
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
		const lara = LaraTranslateServices.createTranslator(credentials);
		lara.setHttpRequest(this.helpers.httpRequest.bind(this.helpers));

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
