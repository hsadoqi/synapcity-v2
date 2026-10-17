/**
 * Which emailed or provider link brought someone back through /auth/callback.
 * The actions tag each redirect URL with it, so a failure can be explained in
 * terms of what the person was actually doing.
 */
export const AUTH_FLOWS = [
  'oauth',
  'confirm',
  'reset',
  'email-change',
  'link',
] as const;
export type AuthFlow = (typeof AUTH_FLOWS)[number];

/** Reads an untrusted query value; anything unknown is `null`. */
export function parseAuthFlow(raw: string | null | undefined): AuthFlow | null {
  return (AUTH_FLOWS as readonly string[]).includes(raw ?? '')
    ? (raw as AuthFlow)
    : null;
}

/**
 * The link an email or provider sends someone back to. `next` is the
 * already-validated destination and `flow` tags it so a failure can be
 * explained; see `parseAuthFlow` for the reading side.
 */
export function callbackUrl(
  origin: string,
  next: string,
  flow: AuthFlow,
): string {
  const params = new URLSearchParams({ next, flow });
  return `${origin}/auth/callback?${params}`;
}

/** Where to send someone when a flow fails, carrying the reason when known. */
export function authErrorPath(flow: AuthFlow | null): string {
  return flow ? `/auth/error?reason=${flow}` : '/auth/error';
}

/** Where a brand-new account confirms its name and photo before moving on. */
export const WELCOME_PATH = '/auth/welcome';

/**
 * The welcome step, then on to `next`. `next` must already be a validated
 * same-origin path (see `safeNextPath`); it is encoded so it cannot add or
 * change parameters of its own.
 */
export function welcomePath(next: string): string {
  return `${WELCOME_PATH}?${new URLSearchParams({ next })}`;
}
