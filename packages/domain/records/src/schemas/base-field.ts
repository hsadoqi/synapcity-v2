import {
  DESCRIPTION_MAX,
  ICON_MAX,
  ICON_NAME_PATTERN,
  NAME_MAX,
  RECORD_MESSAGES,
  TAG_MAX,
  TAGS_MAX,
} from '../constants';
import {
  codePointLength,
  hasVisibleCharacter,
  isPlainText,
  isSingleLineText,
  isStorableText,
  noCaseInsensitiveDuplicates,
} from '../utils';
import { z } from 'zod';

/**
 * A name after trimming: 1 to {@link NAME_MAX} characters of storable text.
 * `blankMessage` is what an empty name says; a kind with its own wording passes
 * it, so the limit is added without changing its copy. A blank name stops at
 * the first check, so it reports one issue, not one per rule.
 */
export function boundedNameSchema(blankMessage?: string) {
  return (
    z
      .string()
      .trim()
      .min(1, { error: blankMessage, abort: true })
      .refine((value) => codePointLength(value) <= NAME_MAX, {
        error: RECORD_MESSAGES.nameTooLong,
      })
      .refine(isStorableText, { error: RECORD_MESSAGES.storableText })
      .refine(isSingleLineText, { error: RECORD_MESSAGES.singleLine })
      // A name of only invisible characters is blank, and says what a blank name says.
      .refine(hasVisibleCharacter, {
        error: blankMessage ?? RECORD_MESSAGES.invisible,
      })
  );
}

/** An icon name: a Lucide identifier of at most {@link ICON_MAX} characters. */
export function boundedIconSchema(patternMessage?: string) {
  return z
    .string()
    .regex(ICON_NAME_PATTERN, patternMessage)
    .refine((value) => codePointLength(value) <= ICON_MAX, {
      error: RECORD_MESSAGES.iconTooLong,
    });
}

export const boundedDescriptionSchema = z
  .string()
  .refine((value) => codePointLength(value) <= DESCRIPTION_MAX, {
    error: RECORD_MESSAGES.descriptionTooLong,
  })
  .refine(isStorableText, { error: RECORD_MESSAGES.storableText })
  .refine(isPlainText, { error: RECORD_MESSAGES.plainText });

export const boundedTagsSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1, { abort: true })
      .refine((value) => codePointLength(value) <= TAG_MAX, {
        error: RECORD_MESSAGES.tagTooLong,
      })
      .refine(isStorableText, { error: RECORD_MESSAGES.storableText })
      .refine(isSingleLineText, { error: RECORD_MESSAGES.singleLine })
      .refine(hasVisibleCharacter, { error: RECORD_MESSAGES.invisible }),
  )
  .max(TAGS_MAX, { error: RECORD_MESSAGES.tooManyTags })
  .superRefine(noCaseInsensitiveDuplicates);

/**
 * The editable metadata every base record stores. These invariants apply on
 * reads as well as writes: an invalid persisted value is a contract violation,
 * not a valid legacy record. Strictness also keeps server-managed fields out
 * of metadata-only inputs. Tags are trimmed, never truncated.
 */
export const baseRecordMetadataSchema = z.strictObject({
  name: boundedNameSchema(),
  description: boundedDescriptionSchema.optional(),
  icon: boundedIconSchema(),
  tags: boundedTagsSchema,
});

/**
 * What creating a record takes: a name, and optionally the other editable
 * fields. An omitted icon or tag list is filled in by the database's column
 * default for that kind, never here, so the database stays the one source of
 * creation defaults. Strict, like the input it narrows.
 */
export const baseRecordCreateSchema = baseRecordMetadataSchema.partial({
  description: true,
  icon: true,
  tags: true,
});

/**
 * A partial edit of a strict editable-field schema: every field optional, at
 * least one present, unknown keys refused. Kinds pass their own input schema
 * so their wording carries over; the base patch is
 * `recordPatchSchema(baseRecordMetadataSchema)`.
 */
export function recordPatchSchema<Shape extends z.ZodRawShape>(
  input: z.ZodObject<Shape, z.core.$strict>,
) {
  return input
    .partial()
    .refine((patch) => Object.values(patch).some((v) => v !== undefined), {
      error: RECORD_MESSAGES.emptyPatch,
    });
}

/** A partial edit of the shared editable fields. */
export const baseRecordPatchSchema = recordPatchSchema(
  baseRecordMetadataSchema,
);
