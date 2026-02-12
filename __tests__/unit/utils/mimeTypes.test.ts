import { describe, it, expect } from 'vitest';
import { lookupMimeType } from '../../../nodes/LaraTranslate/utils/mimeTypes';

describe('lookupMimeType', () => {
	it('should return application/pdf for pdf', () => {
		expect(lookupMimeType('pdf')).toBe('application/pdf');
	});

	it('should return correct mime type for docx', () => {
		expect(lookupMimeType('docx')).toBe(
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		);
	});

	it('should return correct mime type for xlsx', () => {
		expect(lookupMimeType('xlsx')).toBe(
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		);
	});

	it('should return text/plain for txt', () => {
		expect(lookupMimeType('txt')).toBe('text/plain');
	});

	it('should return text/html for html', () => {
		expect(lookupMimeType('html')).toBe('text/html');
	});

	it('should return application/octet-stream for unknown extension', () => {
		expect(lookupMimeType('unknown_ext_xyz')).toBe('application/octet-stream');
	});

	it('should handle uppercase extension by normalizing to lowercase', () => {
		expect(lookupMimeType('PDF')).toBe('application/pdf');
	});

	it('should return correct mime type for pptx', () => {
		expect(lookupMimeType('pptx')).toBe(
			'application/vnd.openxmlformats-officedocument.presentationml.presentation',
		);
	});

	it('should return application/json for json', () => {
		expect(lookupMimeType('json')).toBe('application/json');
	});
});
