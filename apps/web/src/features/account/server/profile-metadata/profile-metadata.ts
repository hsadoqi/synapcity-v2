import { PROFILE_CONFIRMED_KEY } from '@/features/account/shared/profile-confirmed';

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

/** Marks the name-and-photo step as done (finished or skipped). */
export function withProfileConfirmed(
  existing: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  return { ...existing, [PROFILE_CONFIRMED_KEY]: true };
}
