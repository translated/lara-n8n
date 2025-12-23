import LaraTranslateServices from '../services/TranslateService';
import { LARA_CONFIG } from '../config/config';
import { getFileExtension } from './utils';
import { resolve, normalize } from 'path';

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
 * Validates and sanitizes file paths to prevent path traversal attacks
 * @param filePath - The file path to validate
 * @param basePath - Optional base path to restrict access to
 * @throws Error if path contains path traversal attempts
 */
export function validateFilePath(filePath: string, basePath?: string): void {
	if (!filePath || filePath.trim().length === 0) {
		throw new Error('File path cannot be empty');
	}

	// Normalize path to resolve '..' and '.'
	const normalizedPath = normalize(filePath);

	// Check for path traversal attempts
	if (normalizedPath.includes('..')) {
		throw new Error('Invalid file path: path traversal detected');
	}

	// Check for absolute paths that might escape intended directory
	if (basePath) {
		const resolvedPath = resolve(normalizedPath);
		const resolvedBase = resolve(basePath);
		if (!resolvedPath.startsWith(resolvedBase)) {
			throw new Error('Invalid file path: access outside base directory not allowed');
		}
	}

	// Block common dangerous patterns
	const dangerousPatterns = ['/etc/', '/proc/', '/sys/', 'C:\\Windows\\', 'C:\\Program Files\\'];
	if (dangerousPatterns.some((pattern) => normalizedPath.includes(pattern))) {
		throw new Error('Invalid file path: access to system directories not allowed');
	}
}

/**
 * Validates document inputs for translation
 * @param documentName - The name of the document
 * @param documentPath - The path of the document (optional if using binary)
 * @throws Error if document name is empty or whitespace, or if path is provided but invalid
 */
export function validateDocumentInputs(documentName: string, documentPath?: string): void {
	if (!documentName || documentName.trim().length === 0) {
		throw new Error('Document name cannot be empty');
	}

	// Validate file extension of document name
	const nameExtension = getFileExtension(documentName);
	if (!nameExtension) {
		throw new Error(`The document name '${documentName}' has no valid extension`);
	}

	// Validate that the extension is supported
	if (!LaraTranslateServices.isExtensionSupported(nameExtension)) {
		throw new Error(
			`The extension '${nameExtension}' is not supported. Check the documentation for supported extensions.`,
		);
	}

	// If path is provided, validate it as well
	if (documentPath) {
		validateFilePath(documentPath);
		validateFileExtensions(documentPath, documentName);
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

	if (!binaryData.data) {
		throw new Error(`Binary property '${binaryPropertyName}' does not contain valid data`);
	}
}

/**
 * Validates that the file extensions are correct for translation
 * @param documentPath The path of the document
 * @param documentName The name of the document
 */
export function validateFileExtensions(documentPath: string, documentName: string): void {
	const pathExtension = getFileExtension(documentPath);
	const nameExtension = getFileExtension(documentName);

	// Check that both files have an extension
	if (!pathExtension) {
		throw new Error(`The document path '${documentPath}' has no valid extension`);
	}
	if (!nameExtension) {
		throw new Error(`The document name '${documentName}' has no valid extension`);
	}

	// Validate that the extension is supported
	if (!LaraTranslateServices.isExtensionSupported(pathExtension)) {
		throw new Error(
			`The extension '${pathExtension}' is not supported. Check the documentation for supported extensions.`,
		);
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
