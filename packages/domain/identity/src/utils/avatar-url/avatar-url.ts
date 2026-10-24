/** Where Supabase serves files from a public bucket, for the `avatars` bucket. */
const UPLOADED_AVATAR_PATH = '/storage/v1/object/public/avatars/';

/**
 * Whether a picture is one the person uploaded, as opposed to the image their
 * Google or GitHub account supplied. Only an uploaded one can be removed;
 * removing it returns to the provider image, or to the default.
 */
export function isUploadedAvatar(url: string | null | undefined): boolean {
  return Boolean(url?.includes(UPLOADED_AVATAR_PATH));
}
