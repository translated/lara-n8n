import { createHash, createHmac, randomBytes } from 'node:crypto';
import { IHttpRequestOptions } from 'n8n-workflow';
import { LaraTranslateAdditionalOptions, TextResult } from '../types/types';
import { DocumentStatus } from '../types/enums';

type HttpRequestFn = (options: IHttpRequestOptions) => Promise<any>;

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => { globalThis.setTimeout(resolve, ms); });
}

const BASE_URL = 'https://api.laratranslate.com';
const POLLING_INTERVAL_MS = 2000;
const MAX_POLL_TIME_MS = 1000 * 60 * 15; // 15 minutes

/**
 * Recursively converts snake_case keys to camelCase.
 * Matches the SDK's parseContent behavior (client.js:10-31) to preserve
 * backwards-compatible output field names (sourceLanguage, contentType, etc.)
 */
function parseContent(content: unknown): unknown {
	if (content === undefined || content === null) return content;
	if (Array.isArray(content)) return content.map(parseContent);
	if (typeof content === 'string') return content;
	if (typeof content === 'object') {
		const result: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(content as Record<string, unknown>)) {
			const camelKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
			result[camelKey] = parseContent(value);
		}
		return result;
	}
	return content;
}

/**
 * Sanitizes a string for use in a Content-Disposition header value.
 * Removes characters that could break the header or enable injection.
 */
function sanitizeHeaderValue(value: string): string {
	return value.replace(/["\r\n\\]/g, '');
}

/**
 * Builds a multipart/form-data body as a single Buffer.
 * Used for S3 presigned uploads where we need to send form fields + a file.
 */
function buildMultipartBody(
	fields: Record<string, string>,
	fileFieldName: string,
	fileBuffer: Buffer,
	filename: string,
	boundary: string,
): Buffer {
	const parts: Buffer[] = [];
	const safeFilename = sanitizeHeaderValue(filename);

	for (const [key, value] of Object.entries(fields)) {
		parts.push(
			Buffer.from(
				`--${boundary}\r\nContent-Disposition: form-data; name="${sanitizeHeaderValue(key)}"\r\n\r\n${sanitizeHeaderValue(value)}\r\n`,
			),
		);
	}

	parts.push(
		Buffer.from(
			`--${boundary}\r\nContent-Disposition: form-data; name="${fileFieldName}"; filename="${safeFilename}"\r\nContent-Type: application/octet-stream\r\n\r\n`,
		),
	);
	parts.push(fileBuffer);
	parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

	return Buffer.concat(parts);
}

/**
 * HTTP client for the Lara Translate API.
 * Implements HMAC-SHA256 request signing (reverse-engineered from @translated/lara SDK).
 * Uses n8n's httpRequest helper for all HTTP calls.
 */
export class LaraApiClient {
	private readonly accessKeyId: string;
	private readonly accessKeySecret: string;
	private httpRequest!: HttpRequestFn;

	constructor(accessKeyId: string, accessKeySecret: string) {
		this.accessKeyId = accessKeyId;
		this.accessKeySecret = accessKeySecret;
	}

	/**
	 * Sets the n8n httpRequest function for the current execution context.
	 * Must be called before any API method.
	 */
	setHttpRequest(fn: HttpRequestFn): void {
		this.httpRequest = fn;
	}

	/**
	 * Computes MD5 hex digest of a string
	 */
	private md5(data: string): string {
		return createHash('md5').update(data).digest('hex');
	}

	/**
	 * Computes HMAC-SHA256 base64 signature
	 */
	private sign(challenge: string): string {
		return createHmac('sha256', this.accessKeySecret).update(challenge).digest('base64');
	}

	/**
	 * Makes an authenticated request to the Lara API.
	 * All requests are sent as HTTP POST with X-HTTP-Method-Override header.
	 */
	private async request(
		method: string,
		path: string,
		body?: Record<string, unknown>,
		extraHeaders?: Record<string, string>,
	): Promise<any> {
		const date = new Date().toUTCString();
		const contentType = 'application/json';

		// Filter out undefined/null values from body (SDK behavior: client.js:67-69)
		let cleanBody: Record<string, unknown> | undefined;
		if (body) {
			cleanBody = Object.fromEntries(
				Object.entries(body).filter(([_, v]) => v !== undefined && v !== null),
			);
			if (Object.keys(cleanBody).length === 0) {
				cleanBody = undefined;
			}
		}

		const contentMd5 = cleanBody ? this.md5(JSON.stringify(cleanBody)) : '';

		// Build challenge string for HMAC signature
		const challenge = `${method}\n${path}\n${contentMd5}\n${contentType}\n${date}`;
		const signature = this.sign(challenge);

		const headers: Record<string, string> = {
			'X-HTTP-Method-Override': method,
			'X-Lara-Date': date,
			'Content-Type': contentType,
			Authorization: `Lara ${this.accessKeyId}:${signature}`,
			...extraHeaders,
		};

		if (contentMd5) {
			headers['Content-MD5'] = contentMd5;
		}

		if (!this.httpRequest) {
			throw new Error('LaraApiClient: httpRequest not set. Call setHttpRequest() before making API calls.');
		}

		const response = await this.httpRequest({
			url: `${BASE_URL}${path}`,
			method: 'POST',
			headers,
			body: cleanBody,
			returnFullResponse: true,
			ignoreHttpStatusErrors: true,
			json: true,
		} as IHttpRequestOptions);

		const statusCode = response.statusCode as number;
		const responseBody = response.body;

		if (statusCode >= 200 && statusCode < 300) {
			return parseContent((responseBody as Record<string, any>)?.content);
		}

		// Handle non-JSON or unexpected error responses (e.g. 502 from load balancer)
		if (typeof responseBody !== 'object' || responseBody === null) {
			throw new Error(`ApiError: HTTP ${statusCode} - ${String(responseBody || 'No response body')}`);
		}

		const error = (responseBody as Record<string, any>).error || {};
		throw new Error(
			`${error.type || 'UnknownError'}: ${error.message || `HTTP ${statusCode}`}`,
		);
	}

	/**
	 * Translates text using the Lara API.
	 * Maps options from camelCase to the API's snake_case format.
	 */
	async translate(
		text: string,
		source: string,
		target: string,
		options: LaraTranslateAdditionalOptions,
	): Promise<TextResult> {
		const extraHeaders: Record<string, string> = {};
		if (options.noTrace) {
			extraHeaders['X-No-Trace'] = 'true';
		}

		return (await this.request(
			'POST',
			'/translate',
			{
				q: text,
				source,
				target,
				content_type: options.contentType,
				multiline: true,
				adapt_to: options.adaptTo,
				glossaries: options.glossaries,
				instructions: options.instructions,
				timeout: options.timeoutMs,
				use_cache: options.useCache,
				cache_ttl: options.cacheTtl,
				style: options.style,
			},
			extraHeaders,
		)) as TextResult;
	}

	/**
	 * Translates a document from a Buffer.
	 * Full flow: upload to S3 → register document → poll status → download result.
	 */
	async translateDocument(
		fileBuffer: Buffer,
		filename: string,
		source: string,
		target: string,
		options: LaraTranslateAdditionalOptions,
	): Promise<Buffer> {
		// Step 1: Get S3 presigned upload URL
		const uploadInfo = (await this.request('GET', '/documents/upload-url', {
			filename,
		})) as { url: string; fields: Record<string, string> };

		// Step 2: Upload file to S3
		const boundary = `----LaraUpload${Date.now()}${randomBytes(16).toString('hex')}`;
		const multipartBody = buildMultipartBody(
			uploadInfo.fields,
			'file',
			fileBuffer,
			filename,
			boundary,
		);

		await this.httpRequest({
			url: uploadInfo.url,
			method: 'POST',
			headers: {
				'Content-Type': `multipart/form-data; boundary=${boundary}`,
			},
			body: multipartBody,
			ignoreHttpStatusErrors: false,
			encoding: 'text',
		} as IHttpRequestOptions);

		// Step 3: Register document with Lara API
		const extraHeaders: Record<string, string> = {};
		if (options.noTrace) {
			extraHeaders['X-No-Trace'] = 'true';
		}

		const document = (await this.request(
			'POST',
			'/documents',
			{
				source,
				target,
				s3key: uploadInfo.fields.key,
				adapt_to: options.adaptTo,
				glossaries: options.glossaries,
				style: options.style,
			},
			extraHeaders,
		)) as { id: string; status: string; errorReason?: string };

		// Step 4: Poll for translation completion
		const documentId = document.id;
		let currentStatus = document.status;
		let currentErrorReason: string | undefined = document.errorReason;
		const start = Date.now();

		while (Date.now() - start < MAX_POLL_TIME_MS) {
			if (currentStatus === DocumentStatus.TRANSLATED) {
				// Step 5: Get download URL
				const downloadInfo = (await this.request(
					'GET',
					`/documents/${documentId}/download-url`,
					{
						output_format: options.outputFormat,
					},
				)) as { url: string };

				// Step 6: Download translated file from S3
				return (await this.httpRequest({
					url: downloadInfo.url,
					method: 'GET',
					encoding: 'arraybuffer',
				} as IHttpRequestOptions)) as Buffer;
			}

			if (currentStatus === DocumentStatus.ERROR) {
				throw new Error(`DocumentError: ${currentErrorReason || 'Unknown document error'}`);
			}

			await delay(POLLING_INTERVAL_MS);

			const polled = (await this.request('GET', `/documents/${documentId}`)) as {
				status: string;
				errorReason?: string;
			};
			currentStatus = polled.status;
			currentErrorReason = polled.errorReason;
		}

		throw new Error(`TimeoutError: Document ${documentId} translation timed out after 15 minutes`);
	}

	/**
	 * Lists all glossaries for the authenticated account.
	 */
	async listGlossaries(): Promise<Array<{ id: string; name: string }>> {
		return (await this.request('GET', '/glossaries')) as Array<{ id: string; name: string }>;
	}

	/**
	 * Lists all translation memories for the authenticated account.
	 */
	async listMemories(): Promise<Array<{ id: string; name: string }>> {
		return (await this.request('GET', '/memories')) as Array<{ id: string; name: string }>;
	}
}
