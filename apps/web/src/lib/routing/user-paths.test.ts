import { describe, expect, it } from 'vitest';

import {
  accountLinksFor,
  dashboardPathFor,
  documentPathFor,
  homePathFor,
  settingsPathFor,
  signInPathFor,
} from './user-paths';

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

describe('accountLinksFor', () => {
  it('pairs the home and settings paths for one id', () => {
    expect(accountLinksFor('u1')).toEqual({
      homeHref: '/u1/home',
      settingsHref: '/u1/settings',
    });
  });

  it('keeps the one-segment encoding for both links', () => {
    expect(accountLinksFor('..')).toEqual({
      homeHref: '/%2E%2E/home',
      settingsHref: '/%2E%2E/settings',
    });
  });
});

describe('documentPathFor and dashboardPathFor', () => {
  it('put an item at its top-level route under the owner’s home (ADR-0013, item 9)', () => {
    expect(documentPathFor('u1', 'd1')).toBe('/u1/home/documents/d1');
    expect(dashboardPathFor('u1', 'b1')).toBe('/u1/home/dashboards/b1');
  });

  it('keep the one-segment encoding of the home path', () => {
    expect(documentPathFor('..', 'd1')).toBe(
      `${homePathFor('..')}/documents/d1`,
    );
  });
});

describe('signInPathFor', () => {
  it('sends the person to sign in and back to where they were', () => {
    expect(signInPathFor('/u1/home/spaces')).toBe(
      '/auth/login?next=%2Fu1%2Fhome%2Fspaces',
    );
  });
});
