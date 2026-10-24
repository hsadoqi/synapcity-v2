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

export type NameInput = z.infer<typeof nameSchema>;
