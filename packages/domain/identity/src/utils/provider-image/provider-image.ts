/** The part of a Supabase identity this reads. */
type IdentityLike = {
  provider?: string;
  identity_data?: Record<string, unknown> | null;
};

const IMAGE_PROVIDERS = ['google', 'github'];

/** Matches the `profiles_avatar_url_https` check in the database. */
function usable(value: unknown): string | null {
  return typeof value === 'string' &&
    value.startsWith('https://') &&
    value.length <= 2048
    ? value
    : null;
}

/**
 * The picture a linked Google or GitHub account supplied, used as the default
 * until the person uploads their own. GitHub calls the key `avatar_url` and
 * Google `picture`, so both are read. Identities persist when `user_metadata`
 * is overwritten, which is why this reads them rather than the metadata.
 */
export function providerImageFrom(
  identities: readonly IdentityLike[] | null | undefined,
): string | null {
  for (const identity of identities ?? []) {
    if (!identity.provider || !IMAGE_PROVIDERS.includes(identity.provider)) {
      continue;
    }
    const data = identity.identity_data ?? {};
    const image = usable(data.avatar_url) ?? usable(data.picture);
    if (image) return image;
  }
  return null;
}
