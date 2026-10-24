/** Opaque, collision-resistant identifier with a readable kind prefix. */
export function createId(prefix: string): string {
  // getRandomValues works in insecure contexts, where randomUUID does not.
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(6)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  return `${prefix}_${hex}`;
}
