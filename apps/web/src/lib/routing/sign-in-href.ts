/**
 * Where "Sign in again" sends a person: the sign-in page, with the page to come
 * back to. The sign-in page checks `next` before it follows it (`safe-next`).
 * Packages receive this as a function so the route stays the app's (ADR-0009).
 */
export function signInHref(returnTo: string): string {
  return `/auth/login?next=${encodeURIComponent(returnTo)}`;
}
