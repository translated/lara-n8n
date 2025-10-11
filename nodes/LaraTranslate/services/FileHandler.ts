import { IBinaryData } from 'n8n-workflow';
import fs from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Handles file I/O operations for document translation
 * Responsible for temp file creation and deletion
 */
export class FileHandler {
	/**
	 * Creates a temporary file from binary data
	 * @param binaryData - Binary data to write
	 * @param extension - File extension
	 * @returns Path to temporary file
	 */
	static async createTempFile(binaryData: IBinaryData, extension: string): Promise<string> {
		const timestamp = Date.now();
		const randomId = Math.random().toString(36).substring(7);
		const documentBuffer = Buffer.from(binaryData.data, 'base64');
		const tempFilePath = join(tmpdir(), `lara-translate-${timestamp}-${randomId}.${extension}`);

		await fs.writeFile(tempFilePath, documentBuffer);
		return tempFilePath;
	}

	/**
	 * Safely deletes a temporary file
	 * Logs errors but doesn't throw to avoid breaking the translation flow
	 * @param filePath - Path to file to delete
	 */
	static async deleteTempFile(filePath: string): Promise<void> {
		try {
			await fs.unlink(filePath);
		} catch (error) {
			console.error(`[LaraTranslate FileHandler] Failed to delete temp file: ${filePath}`, error);
		}
	}
}
