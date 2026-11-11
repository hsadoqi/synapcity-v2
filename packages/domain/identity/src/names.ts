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

/**
 * Validates a display name against `nameSchema` and returns the trimmed name
 * with the first problem's message, so sign-up and the profile form show the
 * same rule in the same words.
 */
export function checkName(raw: string): { name: string; error?: string } {
  const name = raw.trim();
  const result = nameSchema.safeParse(raw);
  if (result.success) return { name: result.data };
  return { name, error: result.error.issues[0]?.message };
}

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

function firstLetterOf(word: string): string | undefined {
  for (const { segment } of graphemes.segment(word)) {
    if (LETTER_OR_DIGIT.test(segment)) return segment;
  }
  return undefined;
}

/**
 * Up to two capital letters from a display name, for an avatar fallback: the
 * first letter of each of the first two words ("ada king lovelace" -> "AK").
 * Empty without a name, so the avatar can show its default image instead.
 *
 * Words are read by grapheme, so an emoji or an accented letter is never cut
 * in half, and a word with no letter or digit (an emoji, a bracket) is skipped.
 */
export function initialsOf(name: string | null): string {
  if (!name) return '';
  return name
    .split(/\s+/)
    .map(firstLetterOf)
    .filter((letter): letter is string => letter !== undefined)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function present(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * The name to show for a person: their display name when they have one, else
 * their first name, else `null` (the interface then falls back to the email).
 * `display_name` is the person's own choice, prefilled once from the provider's
 * name at an OAuth sign-up; it is never derived from `first_name` or
 * `last_name`, so this resolution is for presentation only and its result is
 * never written back as a display name.
 */
export function displayNameOf(profile: {
  displayName?: string | null;
  firstName?: string | null;
}): string | null {
  return present(profile.displayName) ?? present(profile.firstName);
}
