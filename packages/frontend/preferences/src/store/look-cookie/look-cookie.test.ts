import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LOOK_COOKIE_NAME,
  lookOf,
  settingsDefaults,
} from '@synapcity/domain-preferences';
import {
  configureLookCookie,
  readLookCookie,
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

describe('look cookie in the browser', () => {
  it('writes and reads back the same look', () => {
    writeLookCookie(look);
    expect(readLookCookie()).toEqual(look);
  });

  it('reads a missing, malformed, incomplete or newer cookie as null', () => {
    expect(readLookCookie()).toBeNull();
    for (const raw of [
      '%E0%A4%A',
      encodeURIComponent('{not json'),
      encodeURIComponent(JSON.stringify({ ...look, v: 2 })),
      encodeURIComponent(JSON.stringify({ ...look, theme: { mode: 'dark' } })),
    ]) {
      document.cookie = `${LOOK_COOKIE_NAME}=${raw}; Path=/`;
      expect(readLookCookie(), raw).toBeNull();
    }
  });

  it('writes host-only when no domain is configured', () => {
    const set = vi.spyOn(document, 'cookie', 'set');
    configureLookCookie({ domain: '' });
    writeLookCookie(look);
    expect(set.mock.calls[0]?.[0]).not.toContain('Domain=');
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
      set.mockRestore();
    }
  });

  it('uses a valid configured domain when the browser accepts it', () => {
    const set = vi.spyOn(document, 'cookie', 'set');
    configureLookCookie({ domain: '.Example.com' });
    writeLookCookie(look);
    expect(set.mock.calls[0]?.[0]).toContain('Domain=.example.com');
  });

  it('falls back to a host-only cookie when the browser rejects the domain', () => {
    // jsdom serves http://localhost, so a cookie for example.com is refused, as a
    // browser refuses a public suffix such as vercel.app or a foreign host.
    configureLookCookie({ domain: '.example.com' });
    writeLookCookie(look);
    expect(readLookCookie()).toEqual(look);
  });

  it('does not throw when the browser refuses every write', () => {
    vi.spyOn(document, 'cookie', 'set').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => writeLookCookie(look)).not.toThrow();
  });
});
