import { avatarFileSchema } from '@synapcity/domain-identity';
import {
  providerImageFrom,
  toProviderFailure,
  type MetadataPatch,
  type ProviderFailure,
  type ProviderUser,
  type SupabaseServerClient,
} from '@synapcity/server-supabase';

import {
  deletionMarkerActive,
  noActiveDeletionFilter,
} from '../../account-deletion/deletion-marker';
import { detectImageType, extensionFor } from '../image-type';
import { withAvatarUrl } from '../profile-metadata';
import {
  AVATAR_BUCKET,
  ORPHAN_MIN_AGE_MS,
  avatarPathFrom,
  listAvatarObjects,
  removeAvatarObjects,
} from './avatar-objects';

export type AvatarRequest =
  { kind: 'upload'; file: unknown } | { kind: 'remove' };

export type AvatarSaved =
  | {
      ok: true;
      /** The picture the profile now records: this save's, or a newer one. */
      avatarUrl: string | null;
      patch: MetadataPatch;
    }
  | {
      ok: false;
      /**
       * Why it failed. The host owns the wording.
       * - `invalid-file` carries the domain schema's own message.
       * - `upload-failed` and `profile-not-saved` carry a failure.
       * - `account-deleting`: an account deletion is under way; nothing saved.
       * - `conflict`: other saves kept changing the picture; nothing saved.
       * - `unconfirmed`: the save may or may not have been recorded (the
       *   response was lost). The uploaded file is kept, so a late write can
       *   never point at a missing file.
       */
      reason:
        | 'invalid-file'
        | 'unsupported-type'
        | 'upload-failed'
        | 'profile-not-saved'
        | 'account-deleting'
        | 'conflict'
        | 'unconfirmed';
      message?: string;
      failure?: ProviderFailure;
    };

/** How many times a save retries when another save changed the picture first. */
const MAX_COMMIT_ATTEMPTS = 3;

type ProfileAvatarRow = {
  avatar_url: string | null;
  account_deletion_started_at: string | null;
};

type RowRead =
  | { kind: 'row'; row: ProfileAvatarRow }
  | { kind: 'missing' }
  | { kind: 'failed'; failure: ProviderFailure };

async function readAvatarRow(
  client: SupabaseServerClient,
  userId: string,
): Promise<RowRead> {
  const { data, error } = await client
    .from('profiles')
    .select('avatar_url, account_deletion_started_at')
    .eq('id', userId)
    .maybeSingle();
  if (error) return { kind: 'failed', failure: toProviderFailure(error) };
  if (!data) return { kind: 'missing' };
  return { kind: 'row', row: data };
}

/**
 * Records `next` as the avatar only if the row still holds `expected` and no
 * account deletion is active. The condition is part of the UPDATE, so a write
 * that arrives late is judged against the row as it is then and cannot
 * overwrite a newer picture.
 */
async function compareAndSetAvatar(
  client: SupabaseServerClient,
  userId: string,
  expected: string | null,
  next: string | null,
  now: number,
): Promise<
  | { kind: 'committed' }
  | { kind: 'not-matched' }
  | { kind: 'refused'; failure: ProviderFailure }
  | { kind: 'no-response'; failure: ProviderFailure }
> {
  const update = client
    .from('profiles')
    .update({ avatar_url: next })
    .eq('id', userId)
    .or(noActiveDeletionFilter(now));
  const guarded =
    expected === null
      ? update.is('avatar_url', null)
      : update.eq('avatar_url', expected);
  const { data, error } = await guarded.select('id');
  if (error) {
    const failure = toProviderFailure(error);
    // A database or PostgREST refusal carries a code and rolled back. Without
    // one, the response was lost and the write may still have applied.
    return failure.code
      ? { kind: 'refused', failure }
      : { kind: 'no-response', failure };
  }
  return data && data.length > 0
    ? { kind: 'committed' }
    : { kind: 'not-matched' };
}

/**
 * Uploads a new avatar, or removes the uploaded one, so that the profile never
 * points at a missing file and no save removes another save's picture.
 *
 * - The type is read from the file's bytes, not from what the browser claims,
 *   and each upload gets a new, unique name in the caller's own folder.
 * - The profile is changed with a compare-and-set against the value read
 *   before the upload, and only while no account deletion is active.
 * - After a commit it removes only the picture it replaced, then objects
 *   nothing references that are older than `ORPHAN_MIN_AGE_MS` (left by saves
 *   that died before cleaning up). A younger object may still belong to a
 *   save in progress, so it is left for a later save.
 * - Removing returns to the picture the person's Google or GitHub account
 *   supplied, or to none, so the default image shows.
 */
export async function saveAvatar(
  client: SupabaseServerClient,
  user: ProviderUser,
  request: AvatarRequest,
  clock: () => number = Date.now,
): Promise<AvatarSaved> {
  let bytes: Uint8Array | undefined;
  let type: ReturnType<typeof detectImageType> = null;
  if (request.kind === 'upload') {
    const parsed = avatarFileSchema.safeParse(request.file);
    if (!parsed.success) {
      return {
        ok: false,
        reason: 'invalid-file',
        message: parsed.error.issues[0]?.message ?? 'Choose an image.',
      };
    }
    bytes = new Uint8Array(await parsed.data.arrayBuffer());
    type = detectImageType(bytes);
    if (!type) return { ok: false, reason: 'unsupported-type' };
  }

  const before = await readAvatarRow(client, user.id);
  if (before.kind === 'failed') {
    return { ok: false, reason: 'profile-not-saved', failure: before.failure };
  }
  if (before.kind === 'missing') {
    return {
      ok: false,
      reason: 'profile-not-saved',
      failure: { code: 'profile_row_missing' },
    };
  }
  if (deletionMarkerActive(before.row.account_deletion_started_at, clock())) {
    return { ok: false, reason: 'account-deleting' };
  }

  let path: string | undefined;
  let next: string | null = providerImageFrom(user.identities);
  if (bytes && type) {
    path = `${user.id}/${crypto.randomUUID()}.${extensionFor(type)}`;
    const { error: uploadError } = await client.storage
      .from(AVATAR_BUCKET)
      .upload(path, bytes, {
        contentType: type,
        // Each upload has its own name, so a cached copy is never stale. An
        // hour, not a year, so a removed picture leaves browser caches soon.
        cacheControl: '3600',
        upsert: false,
      });
    if (uploadError) {
      // The Storage policy refuses uploads while a deletion is active.
      const now = await readAvatarRow(client, user.id);
      if (
        now.kind === 'row' &&
        deletionMarkerActive(now.row.account_deletion_started_at, clock())
      ) {
        return { ok: false, reason: 'account-deleting' };
      }
      return {
        ok: false,
        reason: 'upload-failed',
        failure: toProviderFailure(uploadError),
      };
    }
    next = client.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  const discard = async () => {
    if (path) await removeAvatarObjects(client, [path]);
  };

  let expected = before.row.avatar_url;
  let committed = false;
  for (let attempt = 0; attempt < MAX_COMMIT_ATTEMPTS; attempt += 1) {
    const result = await compareAndSetAvatar(
      client,
      user.id,
      expected,
      next,
      clock(),
    );
    if (result.kind === 'committed') {
      committed = true;
      break;
    }
    if (result.kind === 'refused') {
      await discard();
      return {
        ok: false,
        reason: 'profile-not-saved',
        failure: result.failure,
      };
    }
    if (result.kind === 'no-response') {
      const check = await readAvatarRow(client, user.id);
      if (check.kind === 'row' && check.row.avatar_url === next && path) {
        // This save's own, unique file is recorded: it committed.
        committed = true;
        break;
      }
      // Unknown. The file stays: if the write still applies it must exist,
      // and if it never does, a later save removes it once it is old enough.
      return { ok: false, reason: 'unconfirmed', failure: result.failure };
    }

    // Not matched: another save changed the picture, a deletion started, or
    // the row is gone. Look again before deciding.
    const current = await readAvatarRow(client, user.id);
    if (current.kind !== 'row') {
      await discard();
      return {
        ok: false,
        reason: 'profile-not-saved',
        failure:
          current.kind === 'failed'
            ? current.failure
            : { code: 'profile_row_missing' },
      };
    }
    if (
      deletionMarkerActive(current.row.account_deletion_started_at, clock())
    ) {
      await discard();
      return { ok: false, reason: 'account-deleting' };
    }
    expected = current.row.avatar_url;
  }

  if (!committed) {
    await discard();
    return { ok: false, reason: 'conflict' };
  }

  // The picture this save replaced is now unreferenced and was this user's.
  const replaced = avatarPathFrom(expected, user.id);
  if (replaced && replaced !== path) {
    await removeAvatarObjects(client, [replaced]);
  }

  // What the row holds now, which a newer save may already have changed; the
  // session copy follows the row, never this request's own value.
  const after = await readAvatarRow(client, user.id);
  const avatarUrl = after.kind === 'row' ? after.row.avatar_url : next;
  if (after.kind === 'row') {
    await removeAgedOrphans(
      client,
      user.id,
      [path, avatarPathFrom(avatarUrl, user.id)],
      clock(),
    );
  }

  return {
    ok: true,
    avatarUrl,
    patch: (existing) => withAvatarUrl(existing, avatarUrl),
  };
}

/**
 * Removes objects in the user's folder that nothing references and that are
 * older than `ORPHAN_MIN_AGE_MS`. Best effort: a failure leaves them for the
 * next save or for account deletion.
 */
async function removeAgedOrphans(
  client: SupabaseServerClient,
  userId: string,
  keep: readonly (string | null | undefined)[],
  now: number,
): Promise<void> {
  const listed = await listAvatarObjects(client, userId);
  if (!listed.ok) return;
  const kept = new Set(keep.filter((path): path is string => Boolean(path)));
  const aged = listed.objects
    .filter(
      (object) =>
        !kept.has(object.path) &&
        object.createdAt !== null &&
        now - object.createdAt > ORPHAN_MIN_AGE_MS,
    )
    .map((object) => object.path);
  if (aged.length > 0) await removeAvatarObjects(client, aged);
}
