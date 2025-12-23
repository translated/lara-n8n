import { TranslationStyle } from '@translated/lara/lib/translator/models';
import { PdfTranslationExtensions } from './enums';

export type LaraTranslateAdditionalOptions = {
	instructions?: string[];
	adaptTo?: string[];
	glossaries?: string[];
	style?: TranslationStyle;
	contentType?: string;
	timeoutMs?: number;
	useCache?: boolean;
	cacheTtl?: number;
	noTrace?: boolean;
	outputFormat?: PdfTranslationExtensions.PDF;
	password?: string;
};

export type LaraCredentials = {
	LARA_ACCESS_KEY_ID: string;
	LARA_ACCESS_KEY_SECRET: string;
};

export type SupportedFileFormat = {
	name: string;
	extensions: string[];
	description: string;
};
