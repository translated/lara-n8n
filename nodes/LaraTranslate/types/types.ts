import { PdfTranslationExtensions } from './enums';

export type TranslationStyle = 'faithful' | 'fluid' | 'creative';

export interface NGMemoryMatch {
	memory: string;
	tuid?: string;
	language: [string, string];
	sentence: string;
	translation: string;
	score: number;
}

export interface NGGlossaryMatch {
	glossary: string;
	language: [string, string];
	term: string;
	translation: string;
}

export interface TextResult {
	readonly contentType: string;
	readonly sourceLanguage: string;
	readonly translation: string;
	readonly adaptedTo?: string[];
	readonly glossaries?: string[];
	readonly adaptedToMatches?: NGMemoryMatch[] | NGMemoryMatch[][];
	readonly glossariesMatches?: NGGlossaryMatch[] | NGGlossaryMatch[][];
}

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
};

export type SupportedFileFormat = {
	name: string;
	extensions: string[];
	description: string;
};
