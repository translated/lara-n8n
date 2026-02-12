import { describe, it, expect } from 'vitest';
import {
	languageMapping,
	supportedLanguageSet,
	supportedExtensionsSet,
} from '../../../nodes/LaraTranslate/config/constants';

describe('supportedLanguageSet', () => {
	it('should contain common ISO 639-1 languages', () => {
		const commonLanguages = ['en', 'it', 'fr', 'de', 'es', 'zh', 'ja', 'ko'];
		for (const lang of commonLanguages) {
			expect(supportedLanguageSet.has(lang), `Expected '${lang}' to be supported`).toBe(true);
		}
	});

	it('should contain BCP-47 locale codes', () => {
		expect(supportedLanguageSet.has('en-US')).toBe(true);
		expect(supportedLanguageSet.has('it-IT')).toBe(true);
		expect(supportedLanguageSet.has('zh-CN')).toBe(true);
	});

	it('should not contain invalid codes', () => {
		expect(supportedLanguageSet.has('zz')).toBe(false);
		expect(supportedLanguageSet.has('invalid')).toBe(false);
	});
});

describe('languageMapping', () => {
	it('should have entries for all languages in supportedLanguageSet', () => {
		for (const lang of supportedLanguageSet) {
			expect(
				languageMapping[lang],
				`Expected languageMapping to have entry for '${lang}'`,
			).toBeDefined();
		}
	});

	it('should map common codes to expected names', () => {
		expect(languageMapping['en']).toBe('English');
		expect(languageMapping['it']).toBe('Italian');
		expect(languageMapping['fr']).toBe('French');
		expect(languageMapping['de']).toBe('German');
		expect(languageMapping['es']).toBe('Spanish');
		expect(languageMapping['ja']).toBe('Japanese');
		expect(languageMapping['ko']).toBe('Korean');
		expect(languageMapping['zh']).toBe('Chinese');
	});

	it('should have string values for all entries', () => {
		for (const [key, value] of Object.entries(languageMapping)) {
			expect(typeof value, `Expected string value for '${key}'`).toBe('string');
			expect(value.length, `Expected non-empty value for '${key}'`).toBeGreaterThan(0);
		}
	});
});

describe('supportedExtensionsSet', () => {
	it('should contain common document extensions', () => {
		const commonExtensions = ['pdf', 'docx', 'xlsx', 'pptx', 'txt', 'html'];
		for (const ext of commonExtensions) {
			expect(supportedExtensionsSet.has(ext), `Expected '${ext}' to be supported`).toBe(
				true,
			);
		}
	});

	it('should contain localization format extensions', () => {
		const localizationExtensions = ['xlf', 'xliff', 'po', 'json', 'yaml', 'properties'];
		for (const ext of localizationExtensions) {
			expect(supportedExtensionsSet.has(ext), `Expected '${ext}' to be supported`).toBe(
				true,
			);
		}
	});

	it('should not contain unsupported extensions', () => {
		expect(supportedExtensionsSet.has('exe')).toBe(false);
		expect(supportedExtensionsSet.has('zip')).toBe(false);
		expect(supportedExtensionsSet.has('mp3')).toBe(false);
	});

	it('should be a non-empty set', () => {
		expect(supportedExtensionsSet.size).toBeGreaterThan(0);
	});
});
