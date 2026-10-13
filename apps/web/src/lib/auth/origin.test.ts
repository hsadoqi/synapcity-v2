import { afterEach, describe, expect, it, vi } from 'vitest';

import { getOrigin } from './origin';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getOrigin', () => {
  it('returns the configured origin', () => {
    vi.stubEnv('SITE_URL', 'http://localhost:8080');
    expect(getOrigin()).toBe('http://localhost:8080');
  });

  it('drops a trailing slash, path, query and hash', () => {
    vi.stubEnv('SITE_URL', 'https://app.example.com/some/path/?x=1#top');
    expect(getOrigin()).toBe('https://app.example.com');
  });

  it('keeps a non-default port', () => {
    vi.stubEnv('SITE_URL', 'https://app.example.com:8443/');
    expect(getOrigin()).toBe('https://app.example.com:8443');
  });

  it('throws a message that names the variable when it is not set', () => {
    vi.stubEnv('SITE_URL', '');
    expect(() => getOrigin()).toThrow(/SITE_URL is not set/);
  });

  it.each([
    ['a host with no scheme', 'localhost:8080'],
    ['not a URL at all', 'not a url'],
  ])('throws for %s', (_label, value) => {
    vi.stubEnv('SITE_URL', value);
    expect(() => getOrigin()).toThrow(/SITE_URL/);
  });

  it.each(['ftp://example.com', 'javascript:alert(1)', 'file:///etc/passwd'])(
    'refuses the %s scheme',
    (value) => {
      vi.stubEnv('SITE_URL', value);
      expect(() => getOrigin()).toThrow(/http:\/\/ or https:\/\//);
    },
  );

  it('ignores request-style inputs entirely: only SITE_URL decides', () => {
    // The previous version read Origin/Host headers; a forged header could aim
    // an emailed link at another site. getOrigin takes no arguments now.
    expect(getOrigin.length).toBe(0);
  });
});
