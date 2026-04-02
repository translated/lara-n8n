import { createHmac } from 'node:crypto';
import {
	Icon,
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestOptions,
	INodeProperties,
} from 'n8n-workflow';

export class LaraTranslateApi implements ICredentialType {
	name = 'laraTranslateApi';
	displayName = 'Lara Translate API';
	documentationUrl = 'https://developers.laratranslate.com';
	icon: Icon = 'file:LaraLogo.svg';
	properties: INodeProperties[] = [
		{
			displayName: 'Access Key ID',
			name: 'accessKeyId',
			type: 'string',
			default: '',
			required: true,
			description: 'Your Lara Translate API access key',
		},
		{
			displayName: 'Access Key Secret',
			name: 'accessKeySecret',
			type: 'string',
			default: '',
			required: true,
			typeOptions: {
				password: true,
			},
			description: 'Your Lara Translate API access key secret',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.laratranslate.com',
			url: '/memories',
			method: 'POST',
			headers: {
				'X-HTTP-Method-Override': 'GET',
				'Content-Type': 'application/json',
			},
		},
	};

	async authenticate(
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		const accessKeyId = credentials.accessKeyId as string;
		const accessKeySecret = credentials.accessKeySecret as string;

		const date = new Date().toUTCString();
		const contentType =
			(requestOptions.headers?.['Content-Type'] as string) || 'application/json';

		// Lara API infra doesn't support all HTTP methods; actual method rides in this header
		const logicalMethod =
			(requestOptions.headers?.['X-HTTP-Method-Override'] as string) ||
			requestOptions.method ||
			'GET';

		const path = requestOptions.url;
		// Content-MD5 is empty for bodiless requests; body signing is handled by LaraApiClient
		const challenge = `${logicalMethod}\n${path}\n\n${contentType}\n${date}`;
		const signature = createHmac('sha256', accessKeySecret)
			.update(challenge)
			.digest('base64');

		requestOptions.headers = {
			...requestOptions.headers,
			'X-Lara-Date': date,
			Authorization: `Lara ${accessKeyId}:${signature}`,
		};

		return requestOptions;
	}
}
