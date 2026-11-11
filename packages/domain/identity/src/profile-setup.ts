/**
 * Whether someone has been asked to confirm their name and photo. It is a flag
 * in `user_metadata`, not a database column, so it needs no schema change. The
 * person can edit that metadata, which is harmless: it only decides whether a
 * friendly step is shown, and nothing is authorized by it.
 */
export const PROFILE_CONFIRMED_KEY = 'profile_confirmed';

/** An account made within this many days still counts as new. */
export const NEW_ACCOUNT_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * `created_at` is stamped by the auth server's clock and compared with this
 * server's. A few seconds of difference is normal, and a brand-new account
 * must not look as if it comes from the future and so skip the step.
 */
const CLOCK_SKEW_MS = 5 * 60 * 1000;

export function isProfileConfirmed(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  return metadata?.[PROFILE_CONFIRMED_KEY] === true;
}

/**
 * False when the date is missing or unreadable, so doubt never adds a step.
 * A date further ahead than clock skew can explain cannot be right either.
 */
export function isNewAccount(
  createdAt: string | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!createdAt) return false;
  const created = Date.parse(createdAt);
  if (Number.isNaN(created)) return false;
  const age = now - created;
  return age >= -CLOCK_SKEW_MS && age <= NEW_ACCOUNT_DAYS * DAY_MS;
}

/**
 * Whether to show the step that confirms name and photo: a new account that
 * has not been through it. Anyone already signed up before this step existed
 * is left alone, and so is anyone who has finished or skipped it.
 */
export function needsProfileSetup(
  user: {
    created_at?: string | null;
    user_metadata?: Record<string, unknown> | null;
  },
  now: number = Date.now(),
): boolean {
  return (
    isNewAccount(user.created_at, now) &&
    !isProfileConfirmed(user.user_metadata)
  );
}
