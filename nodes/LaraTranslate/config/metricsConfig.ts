/**
 * Ingestion endpoint and channel key for usage metrics.
 *
 * Both are placeholders in the source and are substituted into the compiled
 * dist/ by scripts/bake-metrics.sh at publish time. n8n Cloud's community-node
 * scanner forbids `process` at runtime, so there is no environment variable to
 * read them from — baking them in is the only way they can reach the published
 * package. A value still in `__X__` form, or empty, means metrics are off.
 *
 * The explicit `: string` annotations keep TypeScript from narrowing these to
 * literal types, which would make the placeholder checks look like dead code.
 */
export const METRICS_URL: string = '__METRICS_URL__';
export const METRICS_API_KEY: string = '__METRICS_API_KEY__';
