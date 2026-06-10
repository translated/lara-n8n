import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CLIENT_NAME, PACKAGE_VERSION } from '../../../nodes/LaraTranslate/config/clientHeaders';

const pkgVersion = (
	JSON.parse(readFileSync(join(__dirname, '..', '..', '..', 'package.json'), 'utf8')) as {
		version: string;
	}
).version;

describe('clientHeaders', () => {
	it('exposes the n8n client name', () => {
		expect(CLIENT_NAME).toBe('n8n');
	});

	it('loads PACKAGE_VERSION matching the version field in package.json', () => {
		expect(PACKAGE_VERSION).toBe(pkgVersion);
	});
});
