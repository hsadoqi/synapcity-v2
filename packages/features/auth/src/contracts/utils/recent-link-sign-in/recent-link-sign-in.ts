/**
 * Whether a verified token shows a sign-in by emailed link in the last few
 * minutes. Deleting an account asks for this, so that a session left open on a
 * shared screen, or a stolen one, cannot do it alone: the person must also
 * have the inbox.
 *
 * The token's `amr` claim lists each way the session was authenticated and
 * when. The method names below are the ones Supabase documents for an emailed
 * link (`otp`, `magiclink`). The same list is in the database function
 * `public.delete_own_account()`, which is the check that counts. Anything not
 * listed is refused, so a method name that turns out different fails closed.
 */
const LINK_SIGN_IN_METHODS = ['otp', 'magiclink'] as const;

/** How long after the emailed link the deletion may still be confirmed. */
export const LINK_SIGN_IN_WINDOW_MINUTES = 10;

type AmrEntry = { method?: unknown; timestamp?: unknown };

export function hasRecentLinkSignIn(
  amr: unknown,
  nowSeconds: number,
  windowSeconds: number = LINK_SIGN_IN_WINDOW_MINUTES * 60,
): boolean {
  if (!Array.isArray(amr)) return false;
  return amr.some((entry: unknown) => {
    // A bare string (RFC 8176 form) says how but not when, so it cannot prove
    // recency.
    if (typeof entry !== 'object' || entry === null) return false;
    const { method, timestamp } = entry as AmrEntry;
    return (
      typeof method === 'string' &&
      (LINK_SIGN_IN_METHODS as readonly string[]).includes(method) &&
      typeof timestamp === 'number' &&
      Number.isFinite(timestamp) &&
      timestamp <= nowSeconds + 60 &&
      nowSeconds - timestamp <= windowSeconds
    );
  });
}

/** `hasRecentLinkSignIn` against the clock, for callers that are not components. */
export function hasRecentLinkSignInNow(amr: unknown): boolean {
  return hasRecentLinkSignIn(amr, Math.floor(Date.now() / 1000));
}
