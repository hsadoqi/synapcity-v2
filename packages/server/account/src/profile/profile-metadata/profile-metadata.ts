import { PROFILE_CONFIRMED_KEY } from '@synapcity/domain-identity';

/**
 * Metadata to send to `auth.updateUser({ data })` when the name changes. It
 * carries every existing field, so the result is the same whether the server
 * merges or replaces `data`, and OAuth fields such as `avatar_url` survive.
 */
export function withFullName(
  existing: Record<string, unknown> | null | undefined,
  name: string,
): Record<string, unknown> {
  return { ...existing, full_name: name };
}

/**
 * The same for the avatar: `profiles.avatar_url` is canonical and this mirrors
 * it into the token claims the header reads. `null` drops the key, so the
 * header falls back to initials.
 */
export function withAvatarUrl(
  existing: Record<string, unknown> | null | undefined,
  url: string | null,
): Record<string, unknown> {
  const { avatar_url: _previous, ...rest } = existing ?? {};
  return url ? { ...rest, avatar_url: url } : rest;
}

/**
 * The same for the structured names: `profiles` is canonical, and this mirrors
 * `first_name`, `last_name` and the display name (`full_name`) into the token
 * claims the header reads. A null last name or display name drops its key, so
 * the header falls back to the first name.
 */
export function withProfileNames(
  existing: Record<string, unknown> | null | undefined,
  names: {
    firstName: string;
    lastName: string | null;
    displayName: string | null;
  },
): Record<string, unknown> {
  const {
    first_name: _first,
    last_name: _last,
    full_name: _full,
    ...rest
  } = existing ?? {};
  return {
    ...rest,
    first_name: names.firstName,
    ...(names.lastName ? { last_name: names.lastName } : {}),
    ...(names.displayName ? { full_name: names.displayName } : {}),
  };
}

/**
 * Marks the name-and-photo step as done in `user_metadata`. Transitional: the
 * step is now recorded in `profiles` (`profile_completed_at`,
 * `profile_setup_skipped_at`), and nothing calls this any more.
 */
export function withProfileConfirmed(
  existing: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  return { ...existing, [PROFILE_CONFIRMED_KEY]: true };
}
