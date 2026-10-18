/**
 * Up to two capital letters from a display name, for an avatar fallback.
 * Empty without a name, so the avatar can show its default image instead.
 */
export function initialsOf(name: string | null): string {
  if (!name) return '';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}
