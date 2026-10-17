/**
 * Which emailed or provider link brought someone back through /auth/callback.
 * The actions tag each redirect URL with it, so a failure can be explained in
 * terms of what the person was actually doing.
 */
export const AUTH_FLOWS = ['oauth', 'confirm', 'reset'] as const;
export type AuthFlow = (typeof AUTH_FLOWS)[number];

/** Reads an untrusted query value; anything unknown is `null`. */
export function parseAuthFlow(raw: string | null | undefined): AuthFlow | null {
  return (AUTH_FLOWS as readonly string[]).includes(raw ?? '')
    ? (raw as AuthFlow)
    : null;
}

/** Where to send someone when a flow fails, carrying the reason when known. */
export function authErrorPath(flow: AuthFlow | null): string {
  return flow ? `/auth/error?reason=${flow}` : '/auth/error';
}
