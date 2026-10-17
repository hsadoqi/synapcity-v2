export type DisplayProfile = {
  name: string | null;
  email: string | null;
  imageUrl: string | null;
};

/**
 * The signed-in user as the UI sees it: an id plus display-only fields.
 * `fixture` is set only by development fixture mode; such a user has no
 * session, so the browser must not subscribe to auth events for it.
 */
export type CurrentUser = DisplayProfile & { id: string; fixture?: true };

type ClaimsLike = {
  email?: unknown;
  name?: unknown;
  userId?: string | null;
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
