/**
 * How many minutes after the emailed link an account deletion may still be
 * confirmed, for the words the settings screen shows. The rule itself is
 * `hasRecentLinkSignIn` in `@synapcity/server-supabase`, which mirrors the
 * database function `public.delete_own_account()`; a test in the web app keeps
 * this number equal to theirs.
 */
export const LINK_SIGN_IN_WINDOW_MINUTES = 10;
