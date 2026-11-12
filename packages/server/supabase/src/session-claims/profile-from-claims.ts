import {
  displayNameOf,
  type CurrentUser,
  type DisplayProfile,
} from '@synapcity/domain-identity';

/*
 * Reads the display profile from Supabase token claims. `profiles.display_name`
 * is the canonical display name; saving it mirrors the value into
 * `user_metadata.full_name` so the header can read it from the token without a
 * query. At an OAuth sign-up the signup trigger prefills `display_name` from the
 * provider's `full_name`, else `name`, and the token carries those same keys, so
 * reading `full_name ?? name` here matches the row. `first_name` is copied from
 * the email-registration metadata. Everything here is display-only:
 * `user_metadata` is user-editable, so never authorize with it.
 */

type ClaimsLike = {
  email?: unknown;
  userId?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

/**
 * The display profile plus `displayName`, the raw editable display name. Forms
 * that edit the display name start from `displayName`, never from `name`:
 * `name` is resolved for presentation and may be the first name, which must
 * not be saved back as a display name.
 */
export type ClaimsProfile = DisplayProfile & {
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
};

function text(value: unknown): string | null {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed || null;
}

export function profileFromClaims(claims: ClaimsLike): ClaimsProfile {
  const meta = claims.user_metadata ?? {};
  const displayName = text(meta.full_name) ?? text(meta.name);
  const firstName = text(meta.first_name);
  return {
    name: displayNameOf({ displayName, firstName }),
    displayName,
    firstName,
    lastName: text(meta.last_name),
    email: text(claims.email),
    // GitHub supplies `avatar_url`; Google supplies `picture`.
    imageUrl: text(meta.avatar_url) ?? text(meta.picture),
  };
}

/** The signed-in user as the interface shows them. */
export function currentUserFromClaims(
  claims: ClaimsLike & { sub: string },
): CurrentUser {
  const { name, displayName, firstName, lastName, email, imageUrl } =
    profileFromClaims(claims);
  return {
    id: claims.sub,
    name,
    displayName,
    firstName,
    lastName,
    email,
    imageUrl,
  };
}
