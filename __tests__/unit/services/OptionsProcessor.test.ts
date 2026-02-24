import { describe, it, expect } from 'vitest';
import { OptionsProcessor } from '../../../nodes/LaraTranslate/services/OptionsProcessor';
import { LaraTranslateAdditionalOptions } from '../../../nodes/LaraTranslate/types/types';

describe('OptionsProcessor', () => {
	it('should return empty object for empty options', () => {
		const result = OptionsProcessor.process({});
		expect(result).toEqual({});
	});

	it('should filter empty strings from glossaries', () => {
		const result = OptionsProcessor.process({
			glossaries: ['g1', '', '  '],
		});
		expect(result).toEqual({ glossaries: ['g1'] });
	});

	it('should omit array key when all entries are empty after filtering', () => {
		const result = OptionsProcessor.process({
			adaptTo: ['', '  '],
		});
		expect(result).not.toHaveProperty('adaptTo');
		expect(result).toEqual({});
	});

	it('should filter empty strings from instructions', () => {
		const result = OptionsProcessor.process({
			instructions: ['Be formal', '', 'Use simple language'],
		});
		expect(result).toEqual({
			instructions: ['Be formal', 'Use simple language'],
		});
	});

	it('should preserve scalar options', () => {
		const result = OptionsProcessor.process({
			style: 'fluid',
			contentType: 'text/plain',
			timeoutMs: 5000,
		});
		expect(result).toEqual({
			style: 'fluid',
			contentType: 'text/plain',
			timeoutMs: 5000,
		});
	});

	it('should preserve boolean options', () => {
		const result = OptionsProcessor.process({
			useCache: true,
			noTrace: false,
		});
		expect(result).toEqual({
			useCache: true,
			noTrace: false,
		});
	});

	it('should skip undefined values', () => {
		const options: LaraTranslateAdditionalOptions = {
			style: undefined,
			contentType: undefined,
		};
		const result = OptionsProcessor.process(options);
		expect(result).not.toHaveProperty('style');
		expect(result).not.toHaveProperty('contentType');
	});

	it('should handle full mix of options correctly', () => {
		const result = OptionsProcessor.process({
			instructions: ['Be formal', '', '  '],
			adaptTo: ['mem1', 'mem2'],
			glossaries: ['', '  '],
			style: 'faithful',
			contentType: 'text/html',
			timeoutMs: 10000,
			useCache: true,
			noTrace: false,
			cacheTtl: 3600,
		});
		expect(result).toEqual({
			instructions: ['Be formal'],
			adaptTo: ['mem1', 'mem2'],
			style: 'faithful',
			contentType: 'text/html',
			timeoutMs: 10000,
			useCache: true,
			noTrace: false,
			cacheTtl: 3600,
		});
	});

	it('should preserve cacheTtl numeric value', () => {
		const result = OptionsProcessor.process({
			cacheTtl: 7200,
		});
		expect(result).toEqual({ cacheTtl: 7200 });
	});

	it('should preserve outputFormat option', () => {
		const result = OptionsProcessor.process({
			outputFormat: 'pdf' as any,
		});
		expect(result).toEqual({ outputFormat: 'pdf' });
	});
});
