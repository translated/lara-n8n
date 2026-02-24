import { IBinaryData, ICredentialDataDecryptedObject } from 'n8n-workflow';
import { languageMapping, supportedLanguageSet, supportedExtensionsSet } from '../config/constants';
import { LaraTranslateAdditionalOptions, TextResult } from '../types/types';
import { PdfTranslationExtensions } from '../types/enums';
import { LaraApiClient } from './LaraApiClient';
import { OptionsProcessor } from './OptionsProcessor';
import { getFileExtension, getFileNameWithoutExtension } from '../utils/utils';
import { lookupMimeType } from '../utils/mimeTypes';
import { validateTextInput } from '../utils/validators';

/**
 * Main service class for Lara Translate operations
 * Orchestrates translation requests and language management
 * Delegates specific responsibilities to specialized classes
 */
class LaraTranslateServices {
	/**
	 * Creates a new LaraApiClient instance for the given credentials
	 * @param credentials - Decrypted credentials
	 * @returns LaraApiClient instance
	 */
	static createTranslator(credentials: ICredentialDataDecryptedObject): LaraApiClient {
		const { accessKeyId, accessKeySecret } = credentials;
		if (!accessKeyId || !accessKeySecret) {
			throw new Error('Missing credentials: accessKeyId or accessKeySecret');
		}
		return new LaraApiClient(accessKeyId as string, accessKeySecret as string);
	}

	/**
	 * Retrieves the list of supported languages
	 * Uses only the hardcoded languages from constants.ts
	 * @returns Array of language options with name, value, and description
	 */
	static getSupportedLanguages(): Array<{ name: string; value: string; description?: string }> {
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
		lara: LaraApiClient;
		text: string;
		source: string;
		target: string;
		options: LaraTranslateAdditionalOptions;
	}): Promise<TextResult> {
		validateTextInput(data.text);

		const translateOptions = OptionsProcessor.process(data.options);

		return data.lara.translate(data.text, data.source, data.target, translateOptions);
	}

	/**
	 * Translates a document using Lara API
	 * @param data - Document translation request data
	 * @returns Translation result with binary data
	 */
	static async translateDocument(data: {
		lara: LaraApiClient;
		fileBuffer: Buffer;
		documentName: string;
		source: string;
		target: string;
		options: LaraTranslateAdditionalOptions;
	}): Promise<{ data: IBinaryData }> {
		const { lara, fileBuffer, documentName, options, source, target } = data;

		const translateOptions = OptionsProcessor.process(options);
		let extension = getFileExtension(documentName);

		const translationPlain = await lara.translateDocument(
			fileBuffer,
			documentName,
			source,
			target,
			translateOptions,
		);

		return this.buildBinaryResponse(translationPlain, documentName, extension, options);
	}

	/**
	 * Builds the binary response for document translation
	 * @param translationPlain - Raw translation data as Buffer
	 * @param documentName - Original document name
	 * @param extension - File extension
	 * @param options - Translation options
	 * @returns Formatted binary response
	 */
	private static buildBinaryResponse(
		translationPlain: Buffer,
		documentName: string,
		extension: string,
		options: LaraTranslateAdditionalOptions,
	): { data: IBinaryData } {
		const binary = translationPlain.toString('base64');
		const name = getFileNameWithoutExtension(documentName);

		// Handle PDF translation default format
		if (extension === PdfTranslationExtensions.PDF && !options.outputFormat) {
			extension = PdfTranslationExtensions.DOCX;
		}

		const resolvedMimeType = lookupMimeType(extension);

		return {
			data: {
				data: binary,
				mimeType: resolvedMimeType,
				fileName: `${name}.${extension}`,
				fileExtension: extension,
			} as IBinaryData,
		};
	}
}

export default LaraTranslateServices;
