export type DisplayProfile = {
  name: string | null;
  email: string | null;
  imageUrl: string | null;
};

/** The signed-in user as the UI sees it: an id plus display-only fields. */
export type CurrentUser = DisplayProfile & { id: string };

type ClaimsLike = {
  email?: unknown;
  user_metadata?: Record<string, unknown> | null;
};

function text(value: unknown): string | null {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed || null;
}

/** Display-only. `user_metadata` is user-editable: never authorize with it. */
export function profileFromClaims(claims: ClaimsLike): DisplayProfile {
  const meta = claims.user_metadata ?? {};
  return {
    name: text(meta.full_name) ?? text(meta.name),
    email: text(claims.email),
    imageUrl: text(meta.avatar_url),
  };
}

export function currentUserFromClaims(
  claims: ClaimsLike & { sub: string },
): CurrentUser {
  return { id: claims.sub, ...profileFromClaims(claims) };
}

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
