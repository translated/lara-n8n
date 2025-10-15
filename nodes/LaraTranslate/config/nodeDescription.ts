import { INodeProperties } from 'n8n-workflow';
import { LARA_CONFIG, LARA_DEFAULTS } from './config';

export const translateOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['translation'],
			},
		},
		options: [
			{
				name: 'Translate Text',
				value: 'translateText',
				description: 'Translate text using Lara Translate API',
				action: 'Translate text',
			},
			{
				name: 'Translate Document',
				value: 'translateDocument',
				description: 'Translate a document using Lara Translate API',
				action: 'Translate document',
			},
		],
		default: 'translateText',
	},
];

export const translateFields: INodeProperties[] = [
	{
		displayName: 'Source Language Name or ID',
		name: 'source',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getLanguagesWithAuto',
		},
		options: [
			{
				name: 'Autodetect',
				value: '',
				description: 'Autodetect the source language (default option)',
			},
		],
		default: '',
		displayOptions: {
			show: {
				resource: ['translation'],
				operation: ['translateText', 'translateDocument'],
			},
		},
		description:
			'Source language code (Autodetect if not specified). Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Target Language Name or ID',
		name: 'target',
		type: 'options',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['translation'],
				operation: ['translateText', 'translateDocument'],
			},
		},
		typeOptions: {
			loadOptionsMethod: 'getLanguages',
		},
		description:
			'Target language code (e.g., "en" for English, "it" for Italian). Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
];

export const genericAdvancedOptions: INodeProperties = {
	displayName: 'Additional Options',
	name: 'additionalOptions',
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: {
		show: {
			resource: ['translation'],
			operation: ['translateText', 'translateDocument'],
		},
	},
	options: [
		{
			displayName: 'Glossary Names or IDs',
			name: 'glossaries',
			type: 'multiOptions',
			default: [],
			typeOptions: {
				loadOptionsMethod: 'getGlossaries',
			},
			description:
				'Select glossaries to use for translation. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			placeholder: 'Select glossaries',
		},
		{
			displayName: 'No Trace (Incognito Mode)',
			name: 'noTrace',
			type: 'boolean',
			default: false,
			description:
				'Whether source content and its translation will not be saved on the system (AKA Incognito mode)',
		},
		{
			displayName: 'Translation Memory Names or IDs',
			name: 'adaptTo',
			type: 'multiOptions',
			default: [],
			typeOptions: {
				loadOptionsMethod: 'getMemories',
			},
			description:
				'Select translation memories to adapt to. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			placeholder: 'Select memories',
		},
		// eslint-disable-next-line n8n-nodes-base/node-param-default-missing
		{
			displayName: 'Translation Style',
			name: 'style',
			type: 'options',
			default: LARA_DEFAULTS.STYLE,
			options: [
				{
					name: 'Faithful',
					value: 'faithful',
					description: 'Precise and literal translation',
				},
				{
					name: 'Fluid',
					value: 'fluid',
					description: 'Natural and flowing translation',
				},
				{
					name: 'Creative',
					value: 'creative',
					description: 'Creative and adaptive translation',
				},
			],
			description: 'The style to apply to the translation',
		},
	],
};

export const translateTextFields: INodeProperties[] = [
	// Main fields
	{
		displayName: 'Text to Translate',
		name: 'text',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['translation'],
				operation: ['translateText'],
			},
		},
		description: 'The text content you want to translate',
		typeOptions: {
			rows: 4,
		},
	},

	// Advanced options
	{
		displayName: 'Additional Options For Translate Text',
		name: 'additionalOptionsText',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['translation'],
				operation: ['translateText'],
			},
		},
		options: [
			// eslint-disable-next-line n8n-nodes-base/node-param-default-missing
			{
				displayName: 'Cache TTL (Seconds)',
				name: 'cacheTtl',
				type: 'number',
				default: LARA_CONFIG.DEFAULT_CACHE_TTL,
				description:
					'The time-to-live (TTL) for the cache entry, specifying how long the translation will remain in the cache (default: 2 years)',
				displayOptions: {
					show: {
						useCache: [true],
					},
				},
				typeOptions: {
					minValue: LARA_CONFIG.MIN_CACHE_TTL,
				},
			},
			// eslint-disable-next-line n8n-nodes-base/node-param-default-missing
			{
				displayName: 'Content Type',
				name: 'contentType',
				type: 'options',
				default: LARA_DEFAULTS.CONTENT_TYPE,
				options: [
					{
						name: 'Plain Text',
						value: 'text/plain',
					},
					{
						name: 'XLIFF',
						value: 'application/xliff+xml',
					},
				],
				description: 'Specifies the Content-Type of the text (autodetected if not specified)',
			},
			{
				displayName: 'Instructions',
				name: 'instructions',
				type: 'string',
				default: '',
				typeOptions: {
					multipleValues: true,
					rows: 2,
				},
				description:
					"Instructions are directives that guide Lara's translation process. They can specify formality, tone, or domain-specific terminology, allowing for precise adjustments to match your needs. Lara supports any instruction written in natural language, like instructions about formality, tone and specific terminology",
			},
			// eslint-disable-next-line n8n-nodes-base/node-param-default-missing
			{
				displayName: 'Timeout (Milliseconds)',
				name: 'timeoutMs',
				type: 'number',
				default: LARA_CONFIG.DEFAULT_TIMEOUT_MS,
				description: 'Maximum allowable time (in milliseconds) to perform the translation',
				typeOptions: {
					minValue: LARA_CONFIG.MIN_TIMEOUT_MS,
					maxValue: LARA_CONFIG.MAX_TIMEOUT_MS,
				},
			},
			// eslint-disable-next-line n8n-nodes-base/node-param-default-missing
			{
				displayName: 'Use Cache',
				name: 'useCache',
				type: 'boolean',
				default: LARA_DEFAULTS.USE_CACHE,
				description:
					'Whether the translation should be saved in the cache for future retrieval. Note: Caching is an advanced feature and is not enabled by default.',
			},
		],
	},
];

export const translateDocumentFields: INodeProperties[] = [
	{
		displayName: 'Input Source',
		name: 'inputSource',
		type: 'options',
		default: 'path',
		displayOptions: {
			show: {
				resource: ['translation'],
				operation: ['translateDocument'],
			},
		},
		options: [
			{
				name: 'File Path',
				value: 'path',
				description: 'Specify the path to the document file',
			},
			{
				name: 'Binary Data',
				value: 'binary',
				description: 'Use binary data from a previous node',
			},
		],
		description: 'Choose whether to use a file path or binary data',
	},
	{
		displayName: 'Document Path',
		name: 'documentPath',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['translation'],
				operation: ['translateDocument'],
				inputSource: ['path'],
			},
		},
		description:
			'The path to the document you want to translate. Example: "./example/document.pdf".',
	},
	// eslint-disable-next-line n8n-nodes-base/node-param-default-missing
	{
		displayName: 'Input Binary Field',
		name: 'binaryPropertyName',
		type: 'string',
		default: LARA_DEFAULTS.BINARY_PROPERTY,
		required: true,
		displayOptions: {
			show: {
				resource: ['translation'],
				operation: ['translateDocument'],
				inputSource: ['binary'],
			},
		},
		description: 'The name of the binary property containing the file to translate',
		placeholder: 'e.g., data',
	},
	{
		displayName: 'Document Name',
		name: 'documentName',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['translation'],
				operation: ['translateDocument'],
			},
		},
		description: 'The name of the document in input. Example: "document.docx".',
	},

	// Advanced options - ordered alphabetically by displayName
	{
		displayName: 'Additional Options For Translate Document',
		name: 'additionalOptionsDocument',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['translation'],
				operation: ['translateDocument'],
			},
		},
		options: [
			// eslint-disable-next-line n8n-nodes-base/node-param-default-missing
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
				default: LARA_DEFAULTS.PDF_OUTPUT_FORMAT,
				options: [
					{
						name: 'PDF',
						value: 'pdf',
					},
				],
				description:
					'When you translate a ".pdf" file, you will receive a ".doc" file in output. Use this field to receive a ".pdf" file in output.',
			},
			{
				displayName: 'Password',
				name: 'password',
				type: 'string',
				default: '',
				typeOptions: {
					password: true,
				},
				description: "The password of the PDF file if it's password protected",
			},
		],
	},
];
