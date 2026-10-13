/**
 * Decides which paths require a signed-in user. Called from the session
 * proxy with `request.nextUrl.pathname` (no query string, no origin).
 *
 * Returning true sends an unauthenticated visitor to /auth/login?next=<path>.
 * Public pages, the auth pages themselves and /auth/callback must return false,
 * or sign-in can never complete.
 */
const PROTECTED_PREFIXES = ['/home'];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
