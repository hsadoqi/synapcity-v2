export const MAX_NAME_LENGTH = 100;

/**
 * Validates the display name collected at sign-up. It is stored as
 * `user_metadata.full_name`, the key OAuth providers fill in too. That makes
 * it display-only: the user can edit it, so never authorize with it.
 */
export function checkName(raw: string): { name: string; error?: string } {
  const name = raw.trim();
  if (!name) return { name, error: 'Enter your name.' };
  if (name.length > MAX_NAME_LENGTH) {
    return {
      name,
      error: `Use a name of at most ${MAX_NAME_LENGTH} characters.`,
    };
  }
  return { name };
}
