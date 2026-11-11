import {
  toProviderFailure,
  type ProviderFailure,
  type SupabaseServerClient,
} from '@synapcity/server-supabase';

export const AVATAR_BUCKET = 'avatars';

/**
 * How old an unreferenced object must be before a later save may remove it.
 * An object's `created_at` is set while the request that uploaded it is still
 * running, and that request is ended by the platform within its function limit
 * (300 s configured; 1,800 s is the most any Vercel tier allows), its database
 * statements within the 8 s statement timeout. An hour is past all of those,
 * so no live request can still make an object this old the current avatar.
 */
export const ORPHAN_MIN_AGE_MS = 60 * 60 * 1000;

/** Where a public `avatars` URL keeps the object path. */
const PUBLIC_PATH_MARKER = `/storage/v1/object/public/${AVATAR_BUCKET}/`;

/** The page size `list()` uses unless told otherwise. */
const LIST_PAGE = 100;

export type AvatarObject = { path: string; createdAt: number | null };

/**
 * The object path a public avatar URL points at, when it is an object in this
 * user's own folder; otherwise null (a provider picture, or nothing).
 */
export function avatarPathFrom(
  url: string | null | undefined,
  userId: string,
): string | null {
  if (!url) return null;
  const at = url.indexOf(PUBLIC_PATH_MARKER);
  if (at === -1) return null;
  const rest = url.slice(at + PUBLIC_PATH_MARKER.length).split(/[?#]/)[0]!;
  let path: string;
  try {
    path = decodeURIComponent(rest);
  } catch {
    return null;
  }
  return path.startsWith(`${userId}/`) ? path : null;
}

/**
 * Every object under the user's folder, sub-folders included, page by page.
 * A failed page is reported, never treated as an empty folder.
 */
export async function listAvatarObjects(
  client: SupabaseServerClient,
  userId: string,
): Promise<
  | { ok: true; objects: AvatarObject[] }
  | { ok: false; failure: ProviderFailure }
> {
  const objects: AvatarObject[] = [];
  const folders = [userId];
  while (folders.length > 0) {
    const folder = folders.shift()!;
    for (let offset = 0; ; offset += LIST_PAGE) {
      const { data, error } = await client.storage
        .from(AVATAR_BUCKET)
        .list(folder, {
          limit: LIST_PAGE,
          offset,
          sortBy: { column: 'name', order: 'asc' },
        });
      if (error) return { ok: false, failure: toProviderFailure(error) };
      const page = data ?? [];
      for (const entry of page) {
        const path = `${folder}/${entry.name}`;
        // Storage lists a sub-folder as an entry without an id.
        if (entry.id === null) {
          folders.push(path);
        } else {
          const created = entry.created_at ? Date.parse(entry.created_at) : NaN;
          objects.push({
            path,
            createdAt: Number.isNaN(created) ? null : created,
          });
        }
      }
      if (page.length < LIST_PAGE) break;
    }
  }
  return { ok: true, objects };
}

/**
 * Removes the given objects, in batches; the first failure is reported. The
 * count is what Storage says it removed, which leaves out paths it could not
 * see (already gone, or not the caller's).
 */
export async function removeAvatarObjects(
  client: SupabaseServerClient,
  paths: readonly string[],
): Promise<
  { ok: true; removed: number } | { ok: false; failure: ProviderFailure }
> {
  let removed = 0;
  for (let start = 0; start < paths.length; start += LIST_PAGE) {
    const batch = paths.slice(start, start + LIST_PAGE);
    const { data, error } = await client.storage
      .from(AVATAR_BUCKET)
      .remove(batch);
    if (error) return { ok: false, failure: toProviderFailure(error) };
    removed += data?.length ?? 0;
  }
  return { ok: true, removed };
}

/**
 * Removes every object in the user's folder until a listing comes back empty,
 * so objects that arrive while it runs are taken too. A pass that removes
 * nothing is a failure, not a reason to loop.
 */
export async function removeAllAvatarObjects(
  client: SupabaseServerClient,
  userId: string,
): Promise<{ ok: true } | { ok: false; failure: ProviderFailure }> {
  const MAX_PASSES = 20;
  for (let pass = 0; pass < MAX_PASSES; pass += 1) {
    const listed = await listAvatarObjects(client, userId);
    if (!listed.ok) return listed;
    if (listed.objects.length === 0) return { ok: true };
    const result = await removeAvatarObjects(
      client,
      listed.objects.map((object) => object.path),
    );
    if (!result.ok) return result;
    if (result.removed === 0) {
      return { ok: false, failure: { code: 'avatar_objects_not_removed' } };
    }
  }
  return { ok: false, failure: { code: 'avatar_objects_not_removed' } };
}
