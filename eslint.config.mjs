import { config } from '@n8n/node-cli/eslint';

// Only the node/credential sources compiled into dist/ are published (see
// package.json "files") and scanned by n8n Cloud. Tests and build/config
// tooling are dev-only and never shipped, so exclude them from linting.
export default [{ ignores: ['__tests__/**', '**/*.config.ts'] }, ...config];
