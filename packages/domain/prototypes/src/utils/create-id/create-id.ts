/** Opaque, collision-resistant identifier with a readable kind prefix. */
export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}
