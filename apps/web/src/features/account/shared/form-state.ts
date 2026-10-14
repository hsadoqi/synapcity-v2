/** `name` echoes the field so a failed submit does not clear what was typed. */
export type ProfileState = {
  error?: string;
  message?: string;
  name?: string;
};
