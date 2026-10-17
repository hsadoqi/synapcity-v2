/** Profile fields an error can point at, so the form can mark them invalid. */
type ProfileFieldName = 'name';

/** `name` echoes the field so a failed submit does not clear what was typed. */
export type ProfileState = {
  error?: string;
  /** The fields `error` is about; absent when it concerns no one field. */
  fields?: ProfileFieldName[];
  message?: string;
  name?: string;
};
