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

/**
 * Pages that only make sense signed out. A signed-in visitor is sent on to
 * `next` (or the default) instead, so a user who is still signed in cannot
 * "sign up" or "sign in" again and be left unsure which account they are in.
 *
 * Deliberately not listed: /auth/forgot-password and /auth/update-password
 * (a signed-in user may legitimately change their password) and
 * /auth/callback (it finishes sign-in).
 */
const GUEST_ONLY_PATHS = ['/auth/login', '/auth/register'];

export function isGuestOnlyPath(pathname: string): boolean {
  return GUEST_ONLY_PATHS.includes(pathname);
}
