import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class LaraTranslateApi implements ICredentialType {
	name = 'laraTranslateApi';
	displayName = 'Lara Translate API';
	documentationUrl = 'https://developers.laratranslate.com';
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
}
