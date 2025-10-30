import { IBinaryData, ICredentialDataDecryptedObject } from 'n8n-workflow';
import { languageMapping, supportedLanguageSet, supportedExtensionsSet } from '../config/constants';
import { LaraTranslateAdditionalOptions } from '../types/types';
import { TextResult, Translator } from '@translated/lara';
import { lookup as lookupMimeType } from 'mime-types';
import { PdfTranslationExtensions } from '../types/enums';
import { TranslatorCache } from './TranslatorCache';
import { FileHandler } from './FileHandler';
import { OptionsProcessor } from './OptionsProcessor';
import { getFileExtension, getFileNameWithoutExtension, convertToBinaryData } from '../utils/utils';

/**
 * Main service class for Lara Translate operations
 * Orchestrates translation requests and language management
 * Delegates specific responsibilities to specialized classes
 */
class LaraTranslateServices {
	private static translatorCache = new TranslatorCache();

	/**
	 * Retrieves or creates a cached Translator instance
	 * @param credentials - Decrypted credentials
	 * @returns Translator instance
	 */
	static getOrCreateTranslator(credentials: ICredentialDataDecryptedObject): Translator {
		return this.translatorCache.getOrCreate(credentials);
	}

	/**
	 * Retrieves the list of supported languages
	 * Uses only the hardcoded languages from constants.ts
	 * @returns Array of language options with name, value, and description
	 */
	static async getSupportedLanguages(): Promise<
		{ name: string; value: string; description?: string }[]
	> {
		return Array.from(supportedLanguageSet).map((language) => ({
			name: languageMapping[language],
			value: language,
			description: `${languageMapping[language]} (${language})`,
		}));
	}

	/**
	 * Checks if a language is supported
	 * @param language - Language code to check
	 * @returns True if supported
	 */
	static isSupportedLanguage(language: string): boolean {
		return supportedLanguageSet.has(language);
	}

	/**
	 * Checks if a file extension is supported
	 * @param extension - File extension to check
	 * @returns True if supported
	 */
	static isExtensionSupported(extension: string): boolean {
		const normalizedExtension = extension.toLowerCase();
		return supportedExtensionsSet.has(normalizedExtension);
	}

	/**
	 * Extracts file extension from path
	 * Delegates to utils
	 * @param filePath - File path
	 * @returns Extension without dot
	 */
	static getFileExtension(filePath: string): string {
		return getFileExtension(filePath);
	}

	/**
	 * Translates text using Lara API
	 * @param data - Translation request data
	 * @returns Translation result
	 */
	static async translateText(data: {
		lara: Translator;
		text: string;
		source: string;
		target: string;
		options: LaraTranslateAdditionalOptions;
	}): Promise<TextResult<string>> {
		if (data.text.trim().length === 0) {
			throw new Error('No text to translate');
		}

		const translateOptions = OptionsProcessor.process(data.options);

		return data.lara.translate(data.text, data.source, data.target, translateOptions);
	}

	/**
	 * Translates a document file using Lara API
	 * @param data - Document translation request data
	 * @returns Translation result with binary data
	 */
	static async translateDocument(data: {
		lara: Translator;
		documentPath?: string;
		binaryData?: IBinaryData;
		documentName: string;
		source: string;
		target: string;
		options: LaraTranslateAdditionalOptions;
	}): Promise<{
		translationPlain: Blob | Buffer<ArrayBufferLike>;
		translationBinary: { data: IBinaryData };
	}> {
		const { lara, documentPath, binaryData, documentName, options, source, target } = data;

		const translateOptions = OptionsProcessor.process(options);

		let fileInput: string;
		let tempFilePath: string | null = null;
		let extension = getFileExtension(documentName);

		try {
			// Prepare file input
			if (binaryData?.data) {
				tempFilePath = await FileHandler.createTempFile(binaryData, extension);
				fileInput = tempFilePath;
			} else if (documentPath) {
				fileInput = documentPath;
			} else {
				throw new Error('Either documentPath or binaryData must be provided');
			}

			// Perform translation
			const translationPlain = await lara.documents.translate(
				fileInput,
				documentName,
				source,
				target,
				translateOptions,
			);

			// Convert response to binary data
			const translationBinary = await this.buildBinaryResponse(
				translationPlain,
				documentName,
				extension,
				options,
			);

			return {
				translationPlain,
				translationBinary,
			};
		} finally {
			// Clean up temporary file
			if (tempFilePath) {
				await FileHandler.deleteTempFile(tempFilePath);
			}
		}
	}

	/**
	 * Builds the binary response for document translation
	 * @param translationPlain - Raw translation data
	 * @param documentName - Original document name
	 * @param extension - File extension
	 * @param options - Translation options
	 * @returns Formatted binary response
	 */
	private static async buildBinaryResponse(
		translationPlain: Blob | Buffer<ArrayBufferLike>,
		documentName: string,
		extension: string,
		options: LaraTranslateAdditionalOptions,
	): Promise<{ data: IBinaryData }> {
		const binary = await convertToBinaryData(translationPlain);
		const name = getFileNameWithoutExtension(documentName);

		// Handle PDF translation default format
		if (extension === PdfTranslationExtensions.PDF && !options.outputFormat) {
			extension = PdfTranslationExtensions.DOCX;
		}

		const resolvedMimeType = (lookupMimeType(extension) || 'application/octet-stream') as string;

		return {
			data: {
				data: binary,
				mimeType: resolvedMimeType,
				fileName: name,
				fileExtension: extension,
			} as IBinaryData,
		};
	}
}

export default LaraTranslateServices;
