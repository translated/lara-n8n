import { IDataObject, INode, JsonObject, NodeApiError } from 'n8n-workflow';
import { LaraApiHttpError } from '../services/LaraApiClient';
import { getErrorMessage } from './utils';

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

function findLaraApiHttpError(error: unknown): LaraApiHttpError | undefined {
	if (error instanceof LaraApiHttpError) return error;
	const cause = (error as { cause?: unknown } | null)?.cause;
	if (cause instanceof LaraApiHttpError) return cause;
	return undefined;
}

// continueOnFail mode would otherwise flatten the failure to { error: message },
// dropping the HTTP context that NodeApiError exposes in fail-fast mode.
export function buildContinueOnFailJson(error: unknown): IDataObject {
	const httpError = findLaraApiHttpError(error);
	if (httpError) {
		return {
			error: httpError.message,
			statusCode: httpError.statusCode,
			body: httpError.body,
			headers: httpError.headers,
		} as IDataObject;
	}
	return { error: getErrorMessage(error) };
}
