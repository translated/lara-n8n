import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const CLIENT_NAME = 'n8n';

/**
 * Reads this package's version from package.json at module load.
 * The directory depth differs between the TS sources (used by Vitest) and the
 * compiled dist/ tree, so we climb parent directories looking for the
 * package.json whose name matches this package, instead of hardcoding a
 * relative path. Falls back to 'unknown' so a missing/unreadable file degrades
 * gracefully instead of throwing at import time.
 */
function loadPackageVersion(): string {
	let dir = __dirname;
	for (let i = 0; i < 8; i++) {
		try {
			const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
				name?: string;
				version?: string;
			};
			if (pkg.name === 'n8n-nodes-lara-translate' && typeof pkg.version === 'string') {
				return pkg.version;
			}
		} catch {
			// no package.json here (or unreadable) — keep climbing
		}
		const parent = dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return 'unknown';
}

export const PACKAGE_VERSION = loadPackageVersion();
