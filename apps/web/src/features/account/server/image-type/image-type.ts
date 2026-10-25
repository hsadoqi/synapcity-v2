import { AVATAR_FILE_TYPES, type AvatarType } from '@synapcity/domain-identity';

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((byte, index) => bytes[offset + index] === byte);

/**
 * The image type a file really is, read from its first bytes. A browser sends
 * `file.type` from the extension, which the sender controls, so it is never
 * trusted. Anything that is not PNG, JPEG or WebP (SVG included) is `null`.
 */
export function detectImageType(bytes: Uint8Array): AvatarType | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'image/png';
  }
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  // WebP: "RIFF", a 4-byte size, then "WEBP".
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return 'image/webp';
  }
  return null;
}

export const extensionFor = (type: AvatarType) => AVATAR_FILE_TYPES[type];
