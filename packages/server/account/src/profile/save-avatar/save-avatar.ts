import {
  avatarFileSchema,
  providerImageFrom,
} from '@synapcity/domain-identity';
import {
  toProviderFailure,
  type MetadataPatch,
  type ProviderFailure,
  type ProviderUser,
  type SupabaseServerClient,
} from '@synapcity/server-supabase';

import { detectImageType, extensionFor } from '../image-type';
import { withAvatarUrl } from '../profile-metadata';

const AVATAR_BUCKET = 'avatars';

export type AvatarRequest =
  { kind: 'upload'; file: unknown } | { kind: 'remove' };

export type AvatarSaved =
  | {
      ok: true;
      /** The picture to show now: the upload, or the default after a removal. */
      avatarUrl: string | null;
      patch: MetadataPatch;
    }
  | {
      ok: false;
      /**
       * Why it failed. The host owns the wording. `invalid-file` carries the
       * domain schema's own message; the two storage reasons carry a failure.
       */
      reason:
        | 'invalid-file'
        | 'unsupported-type'
        | 'upload-failed'
        | 'profile-not-saved';
      message?: string;
      failure?: ProviderFailure;
    };

/** Deletes every file in the user's avatar folder except `keep`. Best effort. */
export async function removeOldAvatars(
  client: SupabaseServerClient,
  userId: string,
  keep?: string,
): Promise<void> {
  const { data: files } = await client.storage.from(AVATAR_BUCKET).list(userId);
  const stale = (files ?? [])
    .map((file) => `${userId}/${file.name}`)
    .filter((path) => path !== keep);
  if (stale.length > 0) {
    await client.storage.from(AVATAR_BUCKET).remove(stale);
  }
}

/**
 * Uploads a new avatar, or removes the uploaded one. The type is read from the
 * file's bytes, not from what the browser claims, and the file is stored in
 * the caller's own folder under a unique name, so a stale copy is never served
 * from cache. Removing returns to the picture the person's Google or GitHub
 * account supplied, or to none, so the default image shows.
 */
export async function saveAvatar(
  client: SupabaseServerClient,
  user: ProviderUser,
  request: AvatarRequest,
): Promise<AvatarSaved> {
  let path: string | undefined;
  let avatarUrl: string | null = providerImageFrom(user.identities);

  if (request.kind === 'upload') {
    const parsed = avatarFileSchema.safeParse(request.file);
    if (!parsed.success) {
      return {
        ok: false,
        reason: 'invalid-file',
        message: parsed.error.issues[0]?.message ?? 'Choose an image.',
      };
    }

    const bytes = new Uint8Array(await parsed.data.arrayBuffer());
    const type = detectImageType(bytes);
    if (!type) return { ok: false, reason: 'unsupported-type' };

    path = `${user.id}/${crypto.randomUUID()}.${extensionFor(type)}`;
    const { error: uploadError } = await client.storage
      .from(AVATAR_BUCKET)
      .upload(path, bytes, {
        contentType: type,
        // The name is unique per upload, so a long cache never goes stale.
        cacheControl: '31536000',
        upsert: false,
      });
    if (uploadError) {
      return {
        ok: false,
        reason: 'upload-failed',
        failure: toProviderFailure(uploadError),
      };
    }

    avatarUrl = client.storage.from(AVATAR_BUCKET).getPublicUrl(path)
      .data.publicUrl;
  }

  // `select` returns the changed rows: an update that matches nothing is not
  // an error to Postgres, but nothing was saved, so it must not look saved.
  const { data: changed, error: profileError } = await client
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id)
    .select('id');
  if (profileError || !changed?.length) {
    // The picture is not recorded, so do not leave an orphaned file behind.
    if (path) await client.storage.from(AVATAR_BUCKET).remove([path]);
    return {
      ok: false,
      reason: 'profile-not-saved',
      failure: profileError
        ? toProviderFailure(profileError)
        : { code: 'profile_row_missing' },
    };
  }

  await removeOldAvatars(client, user.id, path);

  return {
    ok: true,
    avatarUrl,
    patch: (existing) => withAvatarUrl(existing, avatarUrl),
  };
}
