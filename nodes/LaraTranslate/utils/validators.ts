import LaraTranslateServices from '../services/TranslateService';
import { LARA_CONFIG } from '../config/config';
import { getFileExtension } from './utils';

/**
 * Validates text input for translation
 * @param text - The text to validate
 * @throws Error if text is empty or only whitespace
 */
export function validateTextInput(text: string): void {
	if (!text || text.trim().length === 0) {
		throw new Error('Text to translate cannot be empty');
	}

	// Security: Prevent extremely large text inputs (DoS protection)
	if (text.length > LARA_CONFIG.MAX_TEXT_LENGTH) {
		throw new Error(
			`Text to translate exceeds maximum length of ${LARA_CONFIG.MAX_TEXT_LENGTH} characters`,
		);
	}
}

/**
 * Validates document inputs for translation
 * @param documentName - The name of the document
 * @throws Error if document name is empty or has unsupported extension
 */
export function validateDocumentInputs(documentName: string): void {
	if (!documentName || documentName.trim().length === 0) {
		throw new Error('Document name cannot be empty');
	}

	const nameExtension = getFileExtension(documentName);
	if (!nameExtension) {
		throw new Error(`The document name '${documentName}' has no valid extension`);
	}

	if (!LaraTranslateServices.isExtensionSupported(nameExtension)) {
		throw new Error(
			`The extension '${nameExtension}' is not supported. Check the documentation for supported extensions.`,
		);
	}
}

/**
 * Validates binary data input for document translation
 * @param binaryData - The binary data to validate
 * @param binaryPropertyName - The name of the binary property
 * @throws Error if binary data is missing or invalid
 */
export function validateBinaryInput(binaryData: any, binaryPropertyName: string): void {
	if (!binaryData) {
		throw new Error(`No binary data found in property '${binaryPropertyName}'`);
	}

	if (!binaryData.data && !binaryData.id) {
		throw new Error(`Binary property '${binaryPropertyName}' does not contain valid data`);
	}
}

/**
 * Validates that provided language codes are supported by Lara
 * Empty strings are allowed (for autodetect)
 * @param languages - Array of language codes to validate
 * @throws Error if any language code is not supported
 */
export function validateLanguages(languages: string[]): void {
	for (const language of languages) {
		if (language === '') {
			continue;
		}

		if (!LaraTranslateServices.isSupportedLanguage(language)) {
			throw new Error(
				`The language '${language}' is not supported. Check the documentation for supported languages.`,
			);
		}
	}
}
