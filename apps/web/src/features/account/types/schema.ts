import { z } from 'zod';

/** Matches the `profiles_display_name_length` check in the database. */
export const MAX_NAME_LENGTH = 80;

/**
 * The display name. It is stored in `profiles.display_name` and mirrored to
 * `user_metadata.full_name`, the key OAuth providers fill in too. That makes
 * it display-only: the user can edit it, so never authorize with it. The
 * messages are what the form shows, so the server and the form read the same
 * rule.
 */
export const nameSchema = z
  .string()
  .trim()
  .min(1, 'Enter your name.')
  .max(MAX_NAME_LENGTH, `Use a name of at most ${MAX_NAME_LENGTH} characters.`);

/** What the profile form submits. Add a field here and the types follow. */
export const profileSchema = z.object({ name: nameSchema });

export type ProfileInput = z.infer<typeof profileSchema>;

/** Matches the `avatars` bucket's `file_size_limit`. */
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

/** The image types the `avatars` bucket accepts, and the extension each gets. */
export const AVATAR_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
} as const;

export type AvatarType = keyof typeof AVATAR_TYPES;

export const AVATAR_ACCEPT = Object.keys(AVATAR_TYPES).join(',');

/** The avatar upload. The type is re-checked from the file's bytes on the server. */
export const avatarFileSchema = z
  .file('Choose an image.')
  .min(1, 'Choose an image.')
  .max(
    MAX_AVATAR_BYTES,
    `Use an image of at most ${MAX_AVATAR_BYTES / 1024 / 1024} MB.`,
  )
  .mime(Object.keys(AVATAR_TYPES), 'Use a PNG, JPEG or WebP image.');
