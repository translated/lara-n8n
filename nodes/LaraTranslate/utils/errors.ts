import { IDataObject, INode, JsonObject, NodeApiError } from 'n8n-workflow';
import { LaraApiHttpError } from '../services/LaraApiClient';
import { getErrorMessage } from './utils';

/**
 * Wraps a LaraApiHttpError as a NodeApiError, preserving statusCode/body/headers
 * so n8n's UI can render structured HTTP error details.
 */
export function wrapLaraHttpError(
	node: INode,
	itemIndex: number,
	error: LaraApiHttpError,
): NodeApiError {
	return new NodeApiError(node, error as unknown as JsonObject, {
		itemIndex,
		message: error.message,
		httpCode: String(error.statusCode),
	});
}

/**
 * Recovers the original LaraApiHttpError from a NodeApiError wrapper (via its `cause`),
 * or returns it directly if already a LaraApiHttpError.
 */
function findLaraApiHttpError(error: unknown): LaraApiHttpError | undefined {
	if (error instanceof LaraApiHttpError) return error;
	const cause = (error as { cause?: unknown } | null)?.cause;
	if (cause instanceof LaraApiHttpError) return cause;
	return undefined;
}

/**
 * Builds the output JSON for items that fail when continueOnFail is enabled.
 * Preserves the HTTP context (statusCode/body/headers) when available so users
 * don't lose the structured error details that NodeApiError exposes in fail-fast mode.
 */
export function buildContinueOnFailJson(error: unknown): IDataObject {
	const httpError = findLaraApiHttpError(error);
	if (httpError) {
		return {
			error: httpError.message,
			statusCode: httpError.statusCode,
			body: httpError.body as IDataObject | string | null,
			headers: httpError.headers as IDataObject | undefined,
		};
	}
	return { error: getErrorMessage(error) };
}
