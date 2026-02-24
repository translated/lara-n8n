import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
	resolve: {
		alias: {
			'n8n-workflow': resolve(__dirname, 'node_modules/n8n-workflow/dist/index.js'),
		},
	},
	test: {
		include: ['__tests__/**/*.test.ts'],
		globals: true,
		environment: 'node',
		coverage: {
			provider: 'v8',
			include: ['nodes/**/*.ts', 'credentials/**/*.ts'],
			exclude: ['nodes/**/config/constants.ts'],
		},
	},
});
