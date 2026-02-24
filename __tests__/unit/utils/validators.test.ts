import { describe, it, expect } from 'vitest';
import {
	validateTextInput,
	validateDocumentInputs,
	validateBinaryInput,
	validateLanguages,
} from '../../../nodes/LaraTranslate/utils/validators';

describe('validateTextInput', () => {
	it('should pass for valid text', () => {
		expect(() => validateTextInput('Hello world')).not.toThrow();
	});

	it('should throw for empty string', () => {
		expect(() => validateTextInput('')).toThrow('Text to translate cannot be empty');
	});

	it('should throw for whitespace-only string', () => {
		expect(() => validateTextInput('   ')).toThrow('Text to translate cannot be empty');
	});

	it('should throw for text exceeding max length', () => {
		const longText = 'a'.repeat(10_000_001);
		expect(() => validateTextInput(longText)).toThrow('exceeds maximum length');
	});

	it('should pass for text at exactly max length', () => {
		const maxText = 'a'.repeat(10_000_000);
		expect(() => validateTextInput(maxText)).not.toThrow();
	});
});

describe('validateDocumentInputs', () => {
	it('should pass for valid document name', () => {
		expect(() => validateDocumentInputs('doc.pdf')).not.toThrow();
	});

	it('should throw for empty string', () => {
		expect(() => validateDocumentInputs('')).toThrow('Document name cannot be empty');
	});

	it('should throw for name without extension', () => {
		expect(() => validateDocumentInputs('noext')).toThrow('has no valid extension');
	});

	it('should throw for unsupported extension', () => {
		expect(() => validateDocumentInputs('file.xyz123')).toThrow('is not supported');
	});

	it('should pass for supported extensions', () => {
		expect(() => validateDocumentInputs('file.docx')).not.toThrow();
		expect(() => validateDocumentInputs('file.xlsx')).not.toThrow();
		expect(() => validateDocumentInputs('file.html')).not.toThrow();
	});
});

describe('validateBinaryInput', () => {
	it('should pass for valid binary data', () => {
		expect(() => validateBinaryInput({ data: 'abc' }, 'data')).not.toThrow();
	});

	it('should throw for null binary data', () => {
		expect(() => validateBinaryInput(null, 'data')).toThrow(
			"No binary data found in property 'data'",
		);
	});

	it('should throw for undefined binary data', () => {
		expect(() => validateBinaryInput(undefined, 'data')).toThrow(
			"No binary data found in property 'data'",
		);
	});

	it('should pass for filesystem-backed binary data with .id', () => {
		expect(() => validateBinaryInput({ id: 'some-uuid' }, 'data')).not.toThrow();
	});

	it('should throw for binary data missing both .data and .id', () => {
		expect(() => validateBinaryInput({ nodata: true }, 'myProp')).toThrow(
			"Binary property 'myProp' does not contain valid data",
		);
	});
});

describe('validateLanguages', () => {
	it('should pass for valid language codes', () => {
		expect(() => validateLanguages(['en', 'it'])).not.toThrow();
	});

	it('should pass for empty string (autodetect)', () => {
		expect(() => validateLanguages([''])).not.toThrow();
	});

	it('should pass for mix of empty and valid', () => {
		expect(() => validateLanguages(['', 'fr'])).not.toThrow();
	});

	it('should throw for unsupported language code', () => {
		expect(() => validateLanguages(['en', 'invalid-lang-xyz'])).toThrow(
			"The language 'invalid-lang-xyz' is not supported",
		);
	});

	it('should pass for BCP-47 locale codes', () => {
		expect(() => validateLanguages(['en-US', 'it-IT'])).not.toThrow();
	});
});
