/**
 * Metadata to send to `auth.updateUser({ data })` when the name changes. It
 * carries every existing field, so the result is the same whether the server
 * merges or replaces `data`, and OAuth fields such as `avatar_url` survive.
 */
export function withFullName(
  existing: Record<string, unknown> | null | undefined,
  name: string,
): Record<string, unknown> {
  return { ...existing, full_name: name };
}
