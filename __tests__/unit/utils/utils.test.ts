import { describe, it, expect } from 'vitest';
import {
	getErrorMessage,
	createLaraError,
	getFileExtension,
	getFileNameWithoutExtension,
	cleanStringArray,
} from '../../../nodes/LaraTranslate/utils/utils';

describe('getErrorMessage', () => {
	it('should extract message from Error instance', () => {
		expect(getErrorMessage(new Error('Test error'))).toBe('Test error');
	});

	it('should return string as-is', () => {
		expect(getErrorMessage('Error string')).toBe('Error string');
	});

	it('should extract message from object with message property', () => {
		expect(getErrorMessage({ message: 'test' })).toBe('test');
	});

	it('should return default message for null', () => {
		expect(getErrorMessage(null)).toBe('Unknown error occurred');
	});

	it('should return default message for undefined', () => {
		expect(getErrorMessage(undefined)).toBe('Unknown error occurred');
	});

	it('should return default message for number', () => {
		expect(getErrorMessage(42)).toBe('Unknown error occurred');
	});
});

describe('createLaraError', () => {
	it('should format correctly with Error instance', () => {
		const result = createLaraError(new Error('connection failed'), 'text translation');
		expect(result).toBeInstanceOf(Error);
		expect(result.message).toBe('Lara API error (text translation): connection failed');
	});

	it('should format correctly with string error', () => {
		const result = createLaraError('timeout', 'document translation');
		expect(result).toBeInstanceOf(Error);
		expect(result.message).toBe('Lara API error (document translation): timeout');
	});

	it('should format correctly with unknown error', () => {
		const result = createLaraError(123, 'upload');
		expect(result).toBeInstanceOf(Error);
		expect(result.message).toBe('Lara API error (upload): Unknown error occurred');
	});

	it('should format correctly with object error', () => {
		const result = createLaraError({ message: 'bad request' }, 'api call');
		expect(result).toBeInstanceOf(Error);
		expect(result.message).toBe('Lara API error (api call): bad request');
	});
});

describe('getFileExtension', () => {
	it('should return extension for simple filename', () => {
		expect(getFileExtension('doc.pdf')).toBe('pdf');
	});

	it('should return lowercase extension', () => {
		expect(getFileExtension('FILE.DOCX')).toBe('docx');
	});

	it('should return empty string for no extension', () => {
		expect(getFileExtension('no-ext')).toBe('');
	});

	it('should return last extension for multiple dots', () => {
		expect(getFileExtension('path.with.dots.txt')).toBe('txt');
	});
});

describe('getFileNameWithoutExtension', () => {
	it('should remove extension from simple filename', () => {
		expect(getFileNameWithoutExtension('doc.pdf')).toBe('doc');
	});

	it('should return filename as-is when no extension', () => {
		expect(getFileNameWithoutExtension('no-ext')).toBe('no-ext');
	});

	it('should remove only last extension for multiple dots', () => {
		expect(getFileNameWithoutExtension('multi.dot.file.txt')).toBe('multi.dot.file');
	});
});

describe('cleanStringArray', () => {
	it('should filter empty and whitespace-only strings', () => {
		expect(cleanStringArray(['hello', '', '  ', 'world'])).toEqual(['hello', 'world']);
	});

	it('should return empty array for empty input', () => {
		expect(cleanStringArray([])).toEqual([]);
	});

	it('should trim remaining strings', () => {
		expect(cleanStringArray(['  trim  '])).toEqual(['trim']);
	});
});
