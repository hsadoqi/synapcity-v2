import { z } from 'zod';

/** Matches the `avatars` bucket's `file_size_limit`. */
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

/** The image types the `avatars` bucket accepts, and the extension each gets. */
export const AVATAR_FILE_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
} as const;

export type AvatarType = keyof typeof AVATAR_FILE_TYPES;

export const AVATAR_ACCEPT = Object.keys(AVATAR_FILE_TYPES).join(',');

/**
 * A valid avatar file: present, within the size limit and one of the accepted
 * image types. Optionality is the caller's choice (`avatarFileSchema.optional()`),
 * so a missing file is an error where an upload requires one. The type is
 * re-checked from the file's bytes on the server.
 */
export const avatarFileSchema = z
  .file('Choose an image.')
  .min(1, 'Choose an image.')
  .max(
    MAX_AVATAR_BYTES,
    `Use an image of at most ${MAX_AVATAR_BYTES / 1024 / 1024} MB.`,
  )
  .mime(Object.keys(AVATAR_FILE_TYPES), 'Use a PNG, JPEG or WebP image.');

export type AvatarFileInput = z.infer<typeof avatarFileSchema>;
