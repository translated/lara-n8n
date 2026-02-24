/**
 * Safely extracts error message from unknown error types
 * @param error - Error of unknown type
 * @returns Error message string
 * @example getErrorMessage(new Error('Test')) // returns 'Test'
 * @example getErrorMessage('Error string') // returns 'Error string'
 * @example getErrorMessage({ message: 'Custom' }) // returns 'Custom'
 */
export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	if (typeof error === 'string') {
		return error;
	}
	if (error && typeof error === 'object' && 'message' in error) {
		return String(error.message);
	}
	return 'Unknown error occurred';
}

/**
 * Creates a formatted Lara API error with context
 * @param error - Original error
 * @param context - Context string (e.g., 'text translation', 'document translation')
 * @returns Formatted Error instance
 * @example createLaraError(new Error('Failed'), 'translation') // Error: 'Lara API error (translation): Failed'
 */
export function createLaraError(error: unknown, context: string): Error {
	const message = getErrorMessage(error);
	return new Error(`Lara API error (${context}): ${message}`);
}

/**
 * Extracts file extension from filename or path
 * @param filePath - File path or name
 * @returns Extension without dot (lowercase)
 * @example getFileExtension('document.pdf') // returns 'pdf'
 */
export function getFileExtension(filePath: string): string {
	const lastDotIndex = filePath.lastIndexOf('.');
	if (lastDotIndex === -1) {
		return '';
	}
	return filePath.substring(lastDotIndex + 1).toLowerCase();
}

/**
 * Extracts filename without extension
 * @param fileName - Full filename
 * @returns Filename without extension
 * @example getFileNameWithoutExtension('document.pdf') // returns 'document'
 */
export function getFileNameWithoutExtension(fileName: string): string {
	const lastDotIndex = fileName.lastIndexOf('.');
	return lastDotIndex === -1 ? fileName : fileName.substring(0, lastDotIndex);
}


/**
 * Cleans and filters string arrays
 * Removes empty, null, or whitespace-only strings
 * @param arr - Array to clean
 * @returns Cleaned array with trimmed strings
 * @example cleanStringArray(['hello', '', '  ', 'world']) // returns ['hello', 'world']
 */
export function cleanStringArray(arr: string[]): string[] {
	return arr
		.filter((item) => item && typeof item === 'string' && item.trim().length > 0)
		.map((item) => item.trim());
}
