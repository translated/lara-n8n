export const CLIENT_NAME = 'n8n';

/**
 * This package's version, inlined as a string constant.
 *
 * n8n Cloud's community-node scanner forbids reading package.json at runtime
 * (node:fs / node:path / __dirname are restricted), so the version cannot be
 * loaded dynamically. Keep this in sync with the "version" field in
 * package.json when bumping — the clientHeaders unit test fails if they drift.
 */
export const PACKAGE_VERSION = '1.1.5';
