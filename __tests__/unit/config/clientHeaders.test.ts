import { describe, it, expect } from 'vitest';
import { CLIENT_NAME, PACKAGE_VERSION } from '../../../nodes/LaraTranslate/config/clientHeaders';
import { version as pkgVersion } from '../../../package.json';

describe('clientHeaders', () => {
	it('exposes the n8n client name', () => {
		expect(CLIENT_NAME).toBe('n8n');
	});

	it('keeps the inlined PACKAGE_VERSION in sync with package.json', () => {
		expect(PACKAGE_VERSION).toBe(pkgVersion);
	});
});
