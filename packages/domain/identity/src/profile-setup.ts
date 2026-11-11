/**
 * The `user_metadata` flag that recorded a finished or skipped setup step
 * before `profiles.profile_setup_skipped_at` and `profile_completed_at`
 * existed. Transitional: nothing writes it any more, and the migration
 * `20261111200000_profile_setup_and_deletion_marker.sql` backfilled it as
 * skipped. Kept until its removal is decided.
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
 * Where a person is with the profile-setup step, from the two database
 * timestamps (`profiles.profile_completed_at`, `profiles.profile_setup_skipped_at`).
 * Completion wins: someone who skipped and later saved a first name is
 * completed. `profile_completed_at` is the only completion marker.
 */
export type ProfileSetupState = 'incomplete' | 'skipped' | 'completed';

export function profileSetupStateOf(profile: {
  completedAt: string | null | undefined;
  skippedAt: string | null | undefined;
}): ProfileSetupState {
  if (profile.completedAt) return 'completed';
  if (profile.skippedAt) return 'skipped';
  return 'incomplete';
}

/**
 * Whether to show the step that confirms name and photo: a new account whose
 * setup is still incomplete. Anyone already signed up before this step existed
 * is left alone, and so is anyone who has completed or skipped it. The inputs
 * are plain values, so this rule does not depend on where they are stored.
 */
export function needsProfileSetup(
  profile: {
    createdAt: string | null | undefined;
    completedAt: string | null | undefined;
    skippedAt: string | null | undefined;
  },
  now: number = Date.now(),
): boolean {
  return (
    isNewAccount(profile.createdAt, now) &&
    profileSetupStateOf(profile) === 'incomplete'
  );
}
