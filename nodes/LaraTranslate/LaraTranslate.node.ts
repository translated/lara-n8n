import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
	NodeConnectionTypes,
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
import { executeTextTranslation } from './executors/TextTranslationExecutor';
import { executeDocumentTranslation } from './executors/DocumentTranslationExecutor';
import { buildContinueOnFailJson } from './utils/errors';
import { LaraApiClient } from './services/LaraApiClient';
import {
	createMetricsContext,
	errorTypeFor,
	MetricsContext,
	recordEvent,
	sendEvents,
} from './services/metrics';

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
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
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
					const lara = LaraTranslateServices.createTranslator(credentials);
					lara.setHttpRequest(this.helpers.httpRequest.bind(this.helpers));
					const glossaries = await lara.listGlossaries();
					return glossaries.map((g) => ({
						name: g.name,
						value: g.id,
					}));
				} catch {
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
				} catch {
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

		// Validate resource and operation (same for all items). Kept outside the
		// try below: these run before the metrics context exists, so they have
		// nothing to deliver.
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

		// Usage metrics: the queue is execution-scoped so concurrent executions
		// cannot interleave, and delivery happens once, in the finally below.
		let lara: LaraApiClient | undefined;
		let metrics: MetricsContext | undefined;

		try {
			// Initialize Lara Translate API once per execution
			const credentials = await this.getCredentials('laraTranslateApi');
			lara = LaraTranslateServices.createTranslator(credentials);
			lara.setHttpRequest(this.helpers.httpRequest.bind(this.helpers));

			metrics = createMetricsContext(this.getInstanceId(), credentials, this.getExecutionId());
			const feature = operation === 'translateText' ? 'text' : 'document';
			// isToolExecution() is missing on older n8n runtimes.
			const surface =
				typeof this.isToolExecution === 'function' && this.isToolExecution() ? 'ai_tool' : 'node';
			recordEvent(metrics, 'install');

			for (let i = 0; i < inputItems.length; i++) {
				const startedAt = Date.now();
				let source: string | undefined;
				let target: string | undefined;

				try {
					// Get common parameters
					target = this.getNodeParameter('target', i) as string;
					source = this.getNodeParameter('source', i) as string;
					validateLanguages([source, target]);

					let charsTranslated: number | undefined;
					if (operation === 'translateText') {
						const result = await executeTextTranslation(this, i, lara, source, target);
						returnData.push(...result.data);
						charsTranslated = result.charsTranslated;
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

					recordEvent(metrics, 'auth_success');
					recordEvent(metrics, 'call_success', {
						latencyMs: Date.now() - startedAt,
						charsTranslated,
						feature,
						surface,
						sourceLang: source,
						targetLang: target,
					});
				} catch (error) {
					const errorType = errorTypeFor(error);
					if (errorType === 'auth_401' || errorType === 'auth_403') {
						recordEvent(metrics, 'auth_fail', { errorType });
					}
					recordEvent(metrics, 'call_error', {
						latencyMs: Date.now() - startedAt,
						errorType,
						feature,
						surface,
						sourceLang: source,
						targetLang: target,
					});

					if (this.continueOnFail()) {
						const executionErrorData = this.helpers.constructExecutionMetaData(
							[{ json: buildContinueOnFailJson(error) }],
							{ itemData: { item: i } },
						);
						returnData.push(...executionErrorData);
						continue;
					}

					if (error instanceof NodeOperationError || error instanceof NodeApiError) {
						// Already an n8n error carrying full context; rethrow as-is.
						// eslint-disable-next-line @n8n/community-nodes/require-node-api-error
						throw error;
					}

					throw new NodeOperationError(this.getNode(), error as Error, {
						itemIndex: i,
					});
				}
			}

			return [returnData];
		} finally {
			// Delivered here, not after the loop: a fail-fast error rethrows past
			// any statement placed at the end of execute(), which would drop
			// exactly the call_error events worth having. Awaited so the request
			// is not cut off when n8n finalizes the execution.
			try {
				await sendEvents(this.helpers.httpRequest.bind(this.helpers), metrics, async () =>
					lara?.getAccountId(),
				);
			} catch {
				// sendEvents swallows its own failures; this guards the argument
				// list, because anything thrown inside a finally would replace the
				// error the node is already propagating.
			}
		}
	}
}
