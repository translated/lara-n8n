import { createHash, randomUUID } from 'node:crypto';
import { ICredentialDataDecryptedObject, IHttpRequestOptions } from 'n8n-workflow';
import { CLIENT_NAME, PACKAGE_VERSION } from '../config/clientHeaders';
import { METRICS_API_KEY, METRICS_URL } from '../config/metricsConfig';
import { findLaraApiHttpError } from '../utils/errors';
import { getErrorMessage } from '../utils/utils';

type HttpRequestFn = (options: IHttpRequestOptions) => Promise<unknown>;

interface MetricsHttpResponse {
	statusCode: number;
	body: unknown;
	headers?: Record<string, unknown>;
}

export type MetricsEventType =
	| 'install'
	| 'auth_success'
	| 'auth_fail'
	| 'call_success'
	| 'call_error';

export interface MetricsEvent {
	eventId: string;
	eventType: MetricsEventType;
	channel: string;
	channelVersion: string;
	sessionId?: string;
	accountId?: string;
	errorType?: string;
	latencyMs?: number;
	charsTranslated?: number;
	metadata?: Record<string, string>;
}

export interface MetricsEventFields {
	latencyMs?: number;
	charsTranslated?: number;
	errorType?: string;
	feature?: 'text' | 'document';
	surface?: string;
	// Typed unknown on purpose: on the error path these are raw node parameters,
	// whose `as string` cast at the call site is a promise the runtime does not keep.
	sourceLang?: unknown;
	targetLang?: unknown;
}

export interface MetricsContext {
	installationId: string;
	sessionId: string;
	events: MetricsEvent[];
}

const REQUEST_TIMEOUT_MS = 2000;
/** The server accepts 1..1000 events per batch. */
const MAX_BATCH = 1000;
/** Consecutive delivery failures after which metrics stay off for this process. */
const MAX_FAILURES = 3;
/** Renew the token this long before it actually expires. */
const TOKEN_MARGIN_MS = 60_000;
/** The server issues one token per installation every 10s; back off at least that long. */
const TOKEN_COOLDOWN_MS = 10_000;

const MAX_UINT32 = 4294967295;
// Locale codes are short; anything longer is unvalidated user input that must
// not reach the payload. Keeps metadata far below the server's 4096-byte cap.
const MAX_LANG_LENGTH = 16;

// Process-wide state. Everything else — the event queue included — is
// execution-scoped, so concurrent executions cannot interleave into it.
let tokenPromise: Promise<string> | undefined;
let tokenExpiresAt = 0;
let quietUntil = 0;
let failures = 0;
const sentOnce = new Set<string>();

/** Test-only: clears the process-wide state between cases. */
export function resetMetricsState(): void {
	tokenPromise = undefined;
	tokenExpiresAt = 0;
	quietUntil = 0;
	failures = 0;
	sentOnce.clear();
}

function isPlaceholder(value: string): boolean {
	return value === '' || /^__.*__$/.test(value);
}

/**
 * Derives a stable installation UUID from the n8n instance id.
 *
 * Deterministic on purpose: community nodes cannot write to disk, and workflow
 * static data is per-workflow and unreliable for manual executions. Hashing the
 * instance id gives one id per n8n installation that survives restarts without
 * persisting anything. The ingestion service requires UUID shape.
 */
function installationIdFrom(instanceId: string): string {
	const hex = createHash('sha256').update(instanceId).digest('hex').slice(0, 32);
	const variant = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
	return [
		hex.slice(0, 8),
		hex.slice(8, 12),
		`4${hex.slice(13, 16)}`,
		`${variant}${hex.slice(17, 20)}`,
		hex.slice(20, 32),
	].join('-');
}

/**
 * Builds the per-execution metrics context, or undefined when metrics are off —
 * because the ingestion endpoint was never baked in, the instance is not
 * identifiable, or the credential opts out.
 */
export function createMetricsContext(
	instanceId: string,
	credentials: ICredentialDataDecryptedObject,
	sessionId: string,
): MetricsContext | undefined {
	const enabled =
		!isPlaceholder(METRICS_URL) &&
		!isPlaceholder(METRICS_API_KEY) &&
		Boolean(instanceId) &&
		// Credentials saved before this field existed have it undefined, which
		// must keep metrics on — hence `!== false`, not `=== true`.
		credentials.sendUsageMetrics !== false;

	if (!enabled) return undefined;

	return { installationId: installationIdFrom(instanceId), sessionId, events: [] };
}

function clampUint32(value: number | undefined): number | undefined {
	if (value === undefined || !Number.isFinite(value) || value < 0) return undefined;
	return Math.min(Math.floor(value), MAX_UINT32);
}

function lang(value: unknown): string | undefined {
	if (typeof value !== 'string') return undefined;
	const trimmed = value.trim();
	if (!trimmed) return undefined;
	return trimmed.toLowerCase().slice(0, MAX_LANG_LENGTH);
}

/**
 * Maps an error to one of the short, stable tokens the reporting standard
 * defines. Never a message.
 */
export function errorTypeFor(error: unknown): string {
	const httpError = findLaraApiHttpError(error);
	if (httpError) {
		const status = httpError.statusCode;
		if (status === 401) return 'auth_401';
		if (status === 402) return 'payment_402';
		if (status === 403) return 'auth_403';
		if (status === 429) return 'rate_limit_429';
		if (status === 400 || status === 422) return 'validation_error';
		if (status >= 500) return 'server_5xx';
		return 'unknown';
	}

	const message = getErrorMessage(error);
	if (/timed out|timeout|ETIMEDOUT|ESOCKETTIMEDOUT/i.test(message)) return 'timeout';
	if (/ECONNREFUSED|ECONNRESET|ENOTFOUND|EAI_AGAIN|socket hang up/i.test(message)) {
		return 'network_error';
	}
	return 'unknown';
}

/**
 * Events the standard sends once per installation, not once per call. Each
 * outcome gets its own slot: sharing one between auth_success and auth_fail
 * would let an early success hide every later rejection of a different key.
 */
function onceKeyFor(eventType: MetricsEventType): string | undefined {
	if (eventType === 'install' || eventType === 'auth_success' || eventType === 'auth_fail') {
		return eventType;
	}
	return undefined;
}

/**
 * Appends an event to the execution's queue. Pure and synchronous — no I/O, no
 * awaits — so it cannot delay, reorder or break the surrounding translation.
 * `install`, `auth_success` and `auth_fail` are emitted at most once per
 * process; the ingestion service deduplicates by installation id.
 */
export function recordEvent(
	context: MetricsContext | undefined,
	eventType: MetricsEventType,
	fields: MetricsEventFields = {},
): void {
	try {
		if (!context) return;
		// ponytail: the server rejects batches over MAX_BATCH, so stop building
		// events it would refuse. Chunk the delivery instead if workflows with
		// more items than that per execution ever become normal.
		if (context.events.length >= MAX_BATCH) return;

		const onceKey = onceKeyFor(eventType);
		if (onceKey) {
			if (sentOnce.has(onceKey)) return;
			sentOnce.add(onceKey);
		}

		const metadata: Record<string, string> = {};
		if (fields.feature) metadata.feature = fields.feature;
		if (fields.surface) metadata.surface = fields.surface;
		const sourceLang = lang(fields.sourceLang);
		const targetLang = lang(fields.targetLang);
		// An empty source means API-side autodetection.
		if (eventType === 'call_success' || eventType === 'call_error') {
			metadata.sourceLang = sourceLang ?? 'auto';
		} else if (sourceLang) {
			metadata.sourceLang = sourceLang;
		}
		if (targetLang) metadata.targetLang = targetLang;

		context.events.push({
			eventId: randomUUID(),
			eventType,
			channel: CLIENT_NAME,
			channelVersion: PACKAGE_VERSION,
			sessionId: context.sessionId,
			errorType: fields.errorType,
			latencyMs: clampUint32(fields.latencyMs),
			charsTranslated: clampUint32(fields.charsTranslated),
			metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
		});
	} catch {
		// Metrics must never affect the node result.
	}
}

function retryAfterMs(response: MetricsHttpResponse): number {
	const seconds = Number(response.headers?.['retry-after']);
	if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000;
	return TOKEN_COOLDOWN_MS;
}

async function post(
	httpRequest: HttpRequestFn,
	path: string,
	authorization: string,
	body: Record<string, unknown>,
): Promise<MetricsHttpResponse> {
	return (await httpRequest({
		url: `${METRICS_URL}${path}`,
		method: 'POST',
		headers: { Authorization: authorization, 'Content-Type': 'application/json' },
		body,
		json: true,
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
		timeout: REQUEST_TIMEOUT_MS,
	} as IHttpRequestOptions)) as MetricsHttpResponse;
}

async function requestToken(httpRequest: HttpRequestFn, installationId: string): Promise<string> {
	const response = await post(httpRequest, '/auth/issue-token', `Bearer ${METRICS_API_KEY}`, {
		installationId,
	});

	if (response.statusCode === 429) {
		quietUntil = Date.now() + retryAfterMs(response);
		throw new Error('issue-token rate limited');
	}

	const body = (response.body ?? {}) as { token?: string; expiresIn?: number };
	if (response.statusCode < 200 || response.statusCode >= 300 || !body.token) {
		throw new Error(`issue-token returned ${response.statusCode}`);
	}

	tokenExpiresAt = Date.now() + (body.expiresIn ?? 3600) * 1000 - TOKEN_MARGIN_MS;
	return body.token;
}

/**
 * Returns the cached token, or issues one. Caching the promise rather than the
 * string is what makes concurrent executions in the same process share a single
 * request: the service issues one token per installation every 10s, so a
 * stampede would get most of them rejected.
 */
function getToken(httpRequest: HttpRequestFn, installationId: string): Promise<string> {
	if (!tokenPromise || Date.now() >= tokenExpiresAt) {
		// Infinite until the response says otherwise, so a request in flight is
		// never treated as an expired one and re-issued alongside itself.
		tokenExpiresAt = Number.POSITIVE_INFINITY;
		tokenPromise = requestToken(httpRequest, installationId).catch((error) => {
			tokenPromise = undefined;
			tokenExpiresAt = 0;
			throw error;
		});
	}
	return tokenPromise;
}

async function ingest(
	httpRequest: HttpRequestFn,
	installationId: string,
	events: MetricsEvent[],
): Promise<void> {
	const send = async () =>
		post(
			httpRequest,
			'/metrics/ingest-events',
			`Bearer ${await getToken(httpRequest, installationId)}`,
			{ events },
		);

	let response = await send();
	if (response.statusCode === 401) {
		tokenPromise = undefined;
		tokenExpiresAt = 0;
		response = await send();
	}

	if (response.statusCode === 429) {
		quietUntil = Date.now() + retryAfterMs(response);
		return;
	}

	if (response.statusCode < 200 || response.statusCode >= 300) {
		failures += 1;
	}
}

/**
 * Delivers the execution's events. The only place in this module that does I/O.
 *
 * Never throws: a metrics failure must never surface in the workflow.
 */
export async function sendEvents(
	httpRequest: HttpRequestFn,
	context: MetricsContext | undefined,
	getAccountId: () => Promise<string | undefined>,
): Promise<void> {
	try {
		if (!context || context.events.length === 0) return;
		if (failures >= MAX_FAILURES || Date.now() < quietUntil) return;

		const accountId = await getAccountId();

		// Ingestion is all-or-nothing: one event missing a required accountId
		// rejects the whole batch. `install` and `auth_fail` are exempt.
		const events = accountId
			? context.events.map((event) => ({ ...event, accountId }))
			: context.events.filter(
					(event) => event.eventType === 'install' || event.eventType === 'auth_fail',
				);

		if (events.length === 0) return;

		await ingest(httpRequest, context.installationId, events);
	} catch {
		failures += 1;
	}
}
