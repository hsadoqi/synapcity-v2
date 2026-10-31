/**
 * The error a failed read throws. Reads a page needs throw, so the route's
 * error page handles them; the message names the read and the error code
 * only, never the database's own message, which can quote row data. The code
 * is also kept as `code`, so a host that catches the error can log it.
 */
export function readError(
  read: string,
  error: { code?: unknown },
): Error & { code?: string } {
  const code = typeof error.code === 'string' ? error.code : undefined;
  return Object.assign(
    new Error(`Failed to load ${read} (code ${code ?? 'unknown'})`),
    code === undefined ? {} : { code },
  );
}
