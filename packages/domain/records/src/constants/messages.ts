import {
  DESCRIPTION_MAX,
  ICON_MAX,
  NAME_MAX,
  TAG_MAX,
  TAGS_MAX,
} from './limits';

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
