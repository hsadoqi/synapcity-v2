import { describe, expect, it } from 'vitest';

import { homePathFor, settingsPathFor } from './home-path';

describe('homePathFor', () => {
  it('puts the user id in front of /home', () => {
    expect(homePathFor('0b1d6f0e-5c1e-4a53-9d1c-2f6f3a8f9a10')).toBe(
      '/0b1d6f0e-5c1e-4a53-9d1c-2f6f3a8f9a10/home',
    );
  });

  it('encodes an id that is not a plain slug, so it stays one path segment', () => {
    expect(homePathFor('a/b')).toBe('/a%2Fb/home');
  });

  it('never lets an id act as a dot segment', () => {
    expect(homePathFor('..')).toBe('/%2E%2E/home');
    expect(homePathFor('.')).toBe('/%2E/home');
  });
});

describe('settingsPathFor', () => {
  it('uses the same one-segment encoding as homePathFor', () => {
    expect(settingsPathFor('u1')).toBe('/u1/settings');
    expect(settingsPathFor('a/b')).toBe('/a%2Fb/settings');
    expect(settingsPathFor('..')).toBe('/%2E%2E/settings');
  });
});
