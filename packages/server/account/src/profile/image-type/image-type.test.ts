import { describe, expect, it } from 'vitest';

import { detectImageType, extensionFor } from './image-type';

const bytes = (...values: number[]) => new Uint8Array(values);
const text = (value: string) => new TextEncoder().encode(value);

describe('detectImageType', () => {
  it('recognises PNG, JPEG and WebP from their first bytes', () => {
    expect(
      detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)),
    ).toBe('image/png');
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('image/jpeg');
    expect(
      detectImageType(
        new Uint8Array([...text('RIFF'), 1, 2, 3, 4, ...text('WEBP')]),
      ),
    ).toBe('image/webp');
  });

  it.each([
    ['SVG', text('<svg xmlns="http://www.w3.org/2000/svg"></svg>')],
    ['HTML', text('<script>alert(1)</script>')],
    ['GIF', text('GIF89a')],
    [
      'a RIFF file that is not WebP',
      new Uint8Array([...text('RIFF'), 1, 2, 3, 4, ...text('WAVE')]),
    ],
    ['an empty file', new Uint8Array()],
  ])('refuses %s', (_label, data) => {
    expect(detectImageType(data)).toBeNull();
  });
});

describe('extensionFor', () => {
  it('gives each allowed type its extension', () => {
    expect(extensionFor('image/png')).toBe('png');
    expect(extensionFor('image/jpeg')).toBe('jpg');
    expect(extensionFor('image/webp')).toBe('webp');
  });
});
