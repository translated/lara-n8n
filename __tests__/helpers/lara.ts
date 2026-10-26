/** Fixtures shared by the tests that exercise the account id / metrics path. */

export const ACCOUNT_ID = 'acc_4kQpXbW2mNvRt7yZjD3sLh';

/** Builds an unsigned JWT the way the Lara /v2/auth response carries one. */
export function laraToken(payload: Record<string, unknown> = { id: ACCOUNT_ID }): string {
	const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
	return `${encode({ alg: 'HS256' })}.${encode(payload)}.signature`;
}
