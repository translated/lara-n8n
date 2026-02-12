import { LaraTranslateAdditionalOptions } from '../types/types';
import { cleanStringArray } from '../utils/utils';

/**
 * Processes and validates translation options
 * Cleans and sanitizes user input before passing to Lara API
 */
export class OptionsProcessor {
	/**
	 * Processes translation options
	 * @param options - Raw options from user input
	 * @returns Cleaned and validated options
	 */
	static process(options: LaraTranslateAdditionalOptions): LaraTranslateAdditionalOptions {
		return {
			...this.processArrayOptions(options),
			...this.processScalarOptions(options),
		};
	}

	/**
	 * Processes array-based options (glossaries, memories, instructions)
	 * Filters out empty/invalid values
	 * @param options - Raw options
	 * @returns Cleaned array options
	 */
	private static processArrayOptions(
		options: LaraTranslateAdditionalOptions,
	): Partial<LaraTranslateAdditionalOptions> {
		const result: Partial<LaraTranslateAdditionalOptions> = {};

		if (options.adaptTo) {
			const cleanMemoryIds = cleanStringArray(options.adaptTo);
			if (cleanMemoryIds.length > 0) {
				result.adaptTo = cleanMemoryIds;
			}
		}

		if (options.instructions) {
			const cleanInstructions = cleanStringArray(options.instructions);
			if (cleanInstructions.length > 0) {
				result.instructions = cleanInstructions;
			}
		}

		if (options.glossaries) {
			const cleanGlossaries = cleanStringArray(options.glossaries);
			if (cleanGlossaries.length > 0) {
				result.glossaries = cleanGlossaries;
			}
		}

		return result;
	}

	/**
	 * Processes scalar options (style, contentType, timeout, etc.)
	 * @param options - Raw options
	 * @returns Cleaned scalar options
	 */
	private static processScalarOptions(
		options: LaraTranslateAdditionalOptions,
	): Partial<LaraTranslateAdditionalOptions> {
		const result: Partial<LaraTranslateAdditionalOptions> = {};

		// Simple scalar assignments
		const scalarFields: (keyof LaraTranslateAdditionalOptions)[] = [
			'style',
			'contentType',
			'timeoutMs',
			'outputFormat',
		];

		for (const field of scalarFields) {
			if (options[field] !== undefined) {
				result[field] = options[field] as any;
			}
		}

		// Boolean fields (need explicit undefined check)
		if (options.useCache !== undefined) {
			result.useCache = options.useCache;
		}

		if (options.noTrace !== undefined) {
			result.noTrace = options.noTrace;
		}

		// Numeric fields with validation
		if (options.cacheTtl !== undefined) {
			result.cacheTtl = options.cacheTtl;
		}

		return result;
	}
}
