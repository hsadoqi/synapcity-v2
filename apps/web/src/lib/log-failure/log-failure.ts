/** Extra fields that are safe to log: names and flags, never personal data. */
export type LogDetail = Record<string, string | boolean>;

/**
 * Records that an operation failed, by code and status only, plus any `detail`
 * fields the caller chooses (a provider name, a flag). The error object, its
 * message, the session and the person's details never reach the logs, so a
 * failure can be traced without leaking any of them.
 */
export function logFailure(
  operation: string,
  failure: { code?: string; status?: number } | null | undefined,
  detail?: LogDetail,
): void {
  console.warn(`${operation} failed`, {
    ...detail,
    code: failure?.code,
    status: failure?.status,
  });
}
