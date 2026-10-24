import { describe, expect, it } from 'vitest';
import { settingsDefaults } from '../../schemas';
import { LOOK_COOKIE_NAME, lookOf } from './look';
import {
  LOOK_COOKIE_MAX_LENGTH,
  lookFromCookieHeader,
  parseLookCookieValue,
  refreshedLookCookie,
  sanitizeCookieDomain,
  serializeLookCookie,
} from './look-cookie';

const look = lookOf(settingsDefaults);
const value = encodeURIComponent(JSON.stringify(look));

describe('look cookie', () => {
  it('serializes with the agreed attributes', () => {
    const plain = serializeLookCookie(look, { secure: false });
    expect(plain.startsWith(`${LOOK_COOKIE_NAME}=`)).toBe(true);
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

  it('accepts only a plain host name as the domain', () => {
    expect(sanitizeCookieDomain('.Example.com')).toBe('.example.com');
    expect(sanitizeCookieDomain(' a.b.co ')).toBe('a.b.co');
    for (const bad of [
      undefined,
      '',
      '.',
      'localhost',
      'a.com; Secure',
      'a b.com',
      'http://a.com',
      'a..com',
    ])
      expect(sanitizeCookieDomain(bad), String(bad)).toBeUndefined();
  });

  it('ignores a domain that is not a plain host name when serializing', () => {
    expect(
      serializeLookCookie(look, { domain: 'a.com; Secure', secure: false }),
    ).not.toContain('Domain=');
  });

  it('reads a cookie value, and nothing invalid', () => {
    expect(parseLookCookieValue(value)).toEqual(look);
    for (const bad of [
      undefined,
      null,
      '',
      '%E0%A4%A',
      encodeURIComponent('{nope'),
      encodeURIComponent('{"v":2}'),
    ])
      expect(parseLookCookieValue(bad), String(bad)).toBeNull();
  });

  it('refuses a value over the size cap before parsing it', () => {
    const big = encodeURIComponent(
      JSON.stringify({ ...look, pad: 'x'.repeat(LOOK_COOKIE_MAX_LENGTH) }),
    );
    expect(parseLookCookieValue(big)).toBeNull();
  });

  it('finds the look in a Cookie header', () => {
    expect(
      lookFromCookieHeader(`a=1; ${LOOK_COOKIE_NAME}=${value}; b=2`),
    ).toEqual(look);
    expect(lookFromCookieHeader('a=1; b=2')).toBeNull();
    expect(lookFromCookieHeader(null)).toBeNull();
    expect(lookFromCookieHeader(`x${LOOK_COOKIE_NAME}=${value}`)).toBeNull();
  });

  it('re-issues a valid cookie with a fresh lifetime, and never an invalid one', () => {
    const header = `${LOOK_COOKIE_NAME}=${value}`;
    const fresh = refreshedLookCookie(header, {
      domain: '.example.com',
      secure: true,
    });
    expect(fresh).toContain('Max-Age=31536000');
    expect(fresh).toContain('Domain=.example.com');
    expect(fresh).toContain('Secure');
    expect(
      refreshedLookCookie(
        `${LOOK_COOKIE_NAME}=${encodeURIComponent('{"v":2}')}`,
        { secure: false },
      ),
    ).toBeNull();
    expect(refreshedLookCookie(null, { secure: false })).toBeNull();
  });
});
