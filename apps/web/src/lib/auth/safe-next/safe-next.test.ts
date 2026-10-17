import { describe, expect, it } from 'vitest';

import { DEFAULT_NEXT_PATH, safeNextPath } from './safe-next';

describe('safeNextPath', () => {
  it('keeps a same-origin path, including its query and hash', () => {
    expect(safeNextPath('/home')).toBe('/home');
    expect(safeNextPath('/home/settings')).toBe('/home/settings');
    expect(safeNextPath('/home?tab=1#top')).toBe('/home?tab=1#top');
  });

  it('keeps encoded slashes as data, not as a second slash', () => {
    expect(safeNextPath('/%2F/evil.example')).toBe('/%2F/evil.example');
  });

  it('keeps a "//" that sits in the query or hash, where it is harmless', () => {
    expect(safeNextPath('/home?next=//evil.example')).toBe(
      '/home?next=//evil.example',
    );
    expect(safeNextPath('/home#//evil.example')).toBe('/home#//evil.example');
  });

  describe.each([
    ['protocol-relative', '//evil.example'],
    ['triple slash', '///evil.example'],
    ['backslash host', '/\\evil.example'],
    ['tab inside the slashes', '/\t/evil.example'],
    ['newline inside the slashes', '/\n/evil.example'],
    ['dot segment collapsing to "//"', '/.//evil.example'],
    ['parent segment collapsing to "//"', '/a/..//evil.example'],
    ['dot then backslash', '/./\\evil.example'],
    ['absolute https URL', 'https://evil.example'],
    ['javascript: URL', 'javascript:alert(1)'],
    ['relative path with no leading slash', 'home'],
    ['empty string', ''],
  ])('rejects %s', (_label, hostile) => {
    it(`falls back for ${JSON.stringify(hostile)}`, () => {
      expect(safeNextPath(hostile)).toBe(DEFAULT_NEXT_PATH);
    });
  });

  it('falls back for null and undefined', () => {
    expect(safeNextPath(null)).toBe(DEFAULT_NEXT_PATH);
    expect(safeNextPath(undefined)).toBe(DEFAULT_NEXT_PATH);
  });

  it('uses a caller-supplied fallback', () => {
    expect(safeNextPath('//evil.example', '/')).toBe('/');
    expect(safeNextPath(null, '/account')).toBe('/account');
  });

  it('never returns anything but a single-slash, same-origin path', () => {
    const inputs = [
      '/.//a',
      '/a/..//b',
      '//c',
      '/\\d',
      '/\t/e',
      '/ok',
      'https://f',
    ];
    for (const input of inputs) {
      const result = safeNextPath(input);
      expect(result.startsWith('/')).toBe(true);
      expect(result.startsWith('//')).toBe(false);
      expect(result.startsWith('/\\')).toBe(false);
      expect(new URL(result, 'http://app.example').origin).toBe(
        'http://app.example',
      );
    }
  });
});
