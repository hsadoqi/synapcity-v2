/*
 * The limits on a record's editable metadata (owner decision D5) and the text a
 * record may store. One set of constants for the zod schemas; PostgreSQL holds
 * the same numbers in the `resource_metadata_bounds` migration, and the shared
 * boundary vectors (`testing/limit-vectors.json`) check both against the same
 * cases.
 *
 * Lengths are counted in code points, as PostgreSQL's `char_length` does, not
 * in UTF-16 code units as `String.prototype.length` and zod's `.max()` do: an
 * emoji is one character here and two units there.
 */

/** A name, after trimming: 1 to this many characters. */
export const NAME_MAX = 120;
/** A description: at most this many characters. */
export const DESCRIPTION_MAX = 2000;
/** How many tags a record may carry. There is no cap across records. */
export const TAGS_MAX = 20;
/** One tag, after trimming: 1 to this many characters. */
export const TAG_MAX = 50;
/** An icon name: at most this many characters. */
export const ICON_MAX = 64;

/**
 * A Lucide identifier in kebab-case. Store the Lucide identifier, never a
 * React component or SVG markup.
 */
export const ICON_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/*
 * What the record schemas say when a value is refused. One place, so a form, a
 * Server Action and a test all quote the same words instead of repeating them.
 * A kind with its own wording for a case passes it to the schema instead; the
 * rest come from here.
 */
export const RECORD_MESSAGES = {
  nameTooLong: `Keep it to ${NAME_MAX} characters or fewer.`,
  descriptionTooLong: `Keep it to ${DESCRIPTION_MAX} characters or fewer.`,
  iconTooLong: `Keep it to ${ICON_MAX} characters or fewer.`,
  tagTooLong: `Keep each tag to ${TAG_MAX} characters or fewer.`,
  tooManyTags: `Use at most ${TAGS_MAX} tags.`,
  duplicateTag: 'Each tag must be different.',
  storableText: 'This text contains a character that cannot be saved.',
  singleLine: 'Use one line, without control or direction-changing characters.',
  plainText:
    'Remove the control or direction-changing characters from this text.',
  invisible: 'Use at least one visible character.',
  missingId: 'ID is missing.',
  emptyPatch: 'Change at least one field.',
} as const;

/** The exact wording of one of the messages above. */
export type RecordMessage =
  (typeof RECORD_MESSAGES)[keyof typeof RECORD_MESSAGES];
