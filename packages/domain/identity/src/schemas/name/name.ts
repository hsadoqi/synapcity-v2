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

/** The reply for a name with a character no name uses, such as a digit or `@`. */
const NAME_CHARACTERS_MESSAGE =
  'Use letters, spaces, apostrophes, hyphens or full stops.';

/**
 * Letters and combining marks from any script, spaces, apostrophes (straight,
 * curly and the modifier letter), hyphens, full stops, and the zero-width
 * joiner and non-joiner some scripts (Persian, Malayalam) need inside a word.
 * At least one letter is required, so punctuation alone is refused.
 */
const NAME_CHARACTERS =
  /^[\p{L}\p{M}\p{Zs}'\u2019\u02BC.\-\u2010\u200C\u200D]+$/u;
const HAS_LETTER = /\p{L}/u;

function personName(enter: string, tooLong: string) {
  return z
    .string()
    .trim()
    .min(1, enter)
    .max(MAX_NAME_LENGTH, tooLong)
    .refine(
      (value) => NAME_CHARACTERS.test(value) && HAS_LETTER.test(value),
      NAME_CHARACTERS_MESSAGE,
    );
}

/**
 * A first name given when registering with email and password. The database
 * allows none, for OAuth sign-ups, but this path requires one. Matches the
 * `profiles_first_name_valid` check: trimmed, not blank, at most 80 characters.
 */
export const firstNameSchema = personName(
  'Enter your first name.',
  `Use a first name of at most ${MAX_NAME_LENGTH} characters.`,
);

/**
 * An optional last name. Blank or missing becomes `undefined`, so an empty
 * field is never sent as an empty string the database would refuse.
 */
export const lastNameSchema = z
  .string()
  .optional()
  .transform((value) => value?.trim() || undefined)
  .pipe(
    personName(
      'Enter your last name.',
      `Use a last name of at most ${MAX_NAME_LENGTH} characters.`,
    ).optional(),
  );
