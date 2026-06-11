import { config } from '@n8n/node-cli/eslint';

// Only the published node sources (nodes/, credentials/) ship to n8n Cloud and
// are subject to its scanner. Tests and build/config tooling are dev-only and
// never published (see package.json "files"), so exclude them from linting.
export default [{ ignores: ['__tests__/**', '*.config.ts'] }, ...config];
