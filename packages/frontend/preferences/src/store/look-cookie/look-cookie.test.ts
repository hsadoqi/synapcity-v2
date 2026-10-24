import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LOOK_COOKIE_NAME,
  lookOf,
  settingsDefaults,
} from '@synapcity/domain-preferences';
import {
  configureLookCookie,
  readLookCookie,
  serializeLookCookie,
  writeLookCookie,
} from './look-cookie';

const look = lookOf(settingsDefaults);

const clearCookie = () => {
  document.cookie = `${LOOK_COOKIE_NAME}=; Path=/; Max-Age=0`;
};
beforeEach(() => {
  clearCookie();
  configureLookCookie({});
});
afterEach(() => vi.restoreAllMocks());

describe('look cookie', () => {
  it('serializes with the agreed attributes', () => {
    const plain = serializeLookCookie(look, { secure: false });
    expect(plain).toContain(`${LOOK_COOKIE_NAME}=`);
    expect(plain).toContain('Path=/');
    expect(plain).toContain('SameSite=Lax');
    expect(plain).toContain('Max-Age=31536000');
    expect(plain).not.toContain('HttpOnly');
    expect(plain).not.toContain('Domain=');
    expect(plain).not.toContain('Secure');
    const full = serializeLookCookie(look, {
      domain: '.example.com',
      secure: true,
    });
    expect(full).toContain('Domain=.example.com');
    expect(full).toContain('Secure');
  });

  it('writes and reads back the same look', () => {
    writeLookCookie(look);
    expect(readLookCookie()).toEqual(look);
  });

  it('reads a missing, malformed or newer cookie as null', () => {
    expect(readLookCookie()).toBeNull();
    document.cookie = `${LOOK_COOKIE_NAME}=%E0%A4%A; Path=/`;
    expect(readLookCookie()).toBeNull();
    document.cookie = `${LOOK_COOKIE_NAME}=${encodeURIComponent('{not json')}; Path=/`;
    expect(readLookCookie()).toBeNull();
    document.cookie = `${LOOK_COOKIE_NAME}=${encodeURIComponent(JSON.stringify({ ...look, v: 2 }))}; Path=/`;
    expect(readLookCookie()).toBeNull();
  });

  it('writes host-only when no domain is configured', () => {
    configureLookCookie({ domain: '' });
    writeLookCookie(look);
    expect(readLookCookie()).toEqual(look);
  });

  it('ignores a configured domain that is not a plain host name', () => {
    for (const bad of [
      'a.com; Secure',
      'a.com;SameSite=None',
      'a b.com',
      'http://a.com',
      '.',
    ]) {
      const set = vi.spyOn(document, 'cookie', 'set');
      configureLookCookie({ domain: bad });
      writeLookCookie(look);
      expect(set.mock.calls[0]?.[0], bad).not.toContain('Domain=');
      expect(set.mock.calls[0]?.[0], bad).not.toContain(bad);
      set.mockRestore();
    }
    const set = vi.spyOn(document, 'cookie', 'set');
    configureLookCookie({ domain: '.Example.com' });
    writeLookCookie(look);
    expect(set.mock.calls[0]?.[0]).toContain('Domain=.example.com');
  });

  it('does not throw when the browser refuses the write', () => {
    vi.spyOn(document, 'cookie', 'set').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => writeLookCookie(look)).not.toThrow();
  });

  it('stays well under the cookie size limit', () => {
    expect(
      serializeLookCookie(look, { domain: '.example.com', secure: true })
        .length,
    ).toBeLessThan(1000);
  });
});
