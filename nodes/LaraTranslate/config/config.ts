export const LARA_CONFIG = {
	/** Maximum size of the translator cache */
	MAX_CACHE_SIZE: 1000,

	/** Default cache TTL in seconds (2 years) */
	DEFAULT_CACHE_TTL: 63072000,

	/** Default timeout for translation requests in milliseconds */
	DEFAULT_TIMEOUT_MS: 30 * 1000,

	/** Minimum timeout allowed in milliseconds */
	MIN_TIMEOUT_MS: 1 * 1000,

	/** Maximum timeout allowed in milliseconds */
	MAX_TIMEOUT_MS: 30 * 1000,

	/** Minimum cache TTL in seconds */
	MIN_CACHE_TTL: 60,

	/** Maximum text length for translation (DoS protection) */
	MAX_TEXT_LENGTH: 10 * 1000 * 1000,
} as const;

export const LARA_DEFAULTS = {
	/** Default translation style */
	STYLE: 'faithful' as const,

	/** Default content type */
	CONTENT_TYPE: 'text/plain' as const,

	/** Default use cache value */
	USE_CACHE: false,

	/** Default output format for PDFs */
	PDF_OUTPUT_FORMAT: 'pdf' as const,

	/** Default binary property name */
	BINARY_PROPERTY: 'data',
} as const;
