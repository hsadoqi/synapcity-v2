import { nameSchema } from '../../types';

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
