import { avatarFileSchema } from '@/features/account/types';
import { providerImageFrom } from '@/features/account/shared/provider-image';
import { detectImageType, extensionFor } from './image-type';
import { withAvatarUrl } from './profile-metadata';
import {
  SAVE_FAILED,
  type Caller,
  type MetadataPatch,
  type Supabase,
} from './caller';

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
  | { ok: false; error: string; fields?: ['avatar'] };

/** Deletes every file in the user's avatar folder except `keep`. Best effort. */
async function removeOldAvatars(
  supabase: Supabase,
  userId: string,
  keep?: string,
): Promise<void> {
  const { data: files } = await supabase.storage
    .from(AVATAR_BUCKET)
    .list(userId);
  const stale = (files ?? [])
    .map((file) => `${userId}/${file.name}`)
    .filter((path) => path !== keep);
  if (stale.length > 0) {
    await supabase.storage.from(AVATAR_BUCKET).remove(stale);
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
  supabase: Supabase,
  caller: Caller,
  request: AvatarRequest,
): Promise<AvatarSaved> {
  let path: string | undefined;
  let avatarUrl: string | null = providerImageFrom(caller.identities);

  if (request.kind === 'upload') {
    const parsed = avatarFileSchema.safeParse(request.file);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? 'Choose an image.',
        fields: ['avatar'],
      };
    }

    const bytes = new Uint8Array(await parsed.data.arrayBuffer());
    const type = detectImageType(bytes);
    if (!type) {
      return {
        ok: false,
        error: 'Use a PNG, JPEG or WebP image.',
        fields: ['avatar'],
      };
    }

    path = `${caller.id}/${crypto.randomUUID()}.${extensionFor(type)}`;
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, bytes, {
        contentType: type,
        // The name is unique per upload, so a long cache never goes stale.
        cacheControl: '31536000',
        upsert: false,
      });
    if (uploadError) return { ok: false, error: SAVE_FAILED };

    avatarUrl = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
      .data.publicUrl;
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', caller.id);
  if (profileError) {
    // The picture is not recorded, so do not leave an orphaned file behind.
    if (path) await supabase.storage.from(AVATAR_BUCKET).remove([path]);
    return { ok: false, error: SAVE_FAILED };
  }

  await removeOldAvatars(supabase, caller.id, path);

  return {
    ok: true,
    avatarUrl,
    patch: (existing) => withAvatarUrl(existing, avatarUrl),
  };
}
