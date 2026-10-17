import { describe, expect, it } from 'vitest';

import { authErrorPath, callbackUrl, parseAuthFlow } from './auth-flow';

describe('callbackUrl', () => {
  it('tags the callback with the destination and the flow', () => {
    expect(callbackUrl('https://app.test', '/a/b', 'confirm')).toBe(
      'https://app.test/auth/callback?next=%2Fa%2Fb&flow=confirm',
    );
  });

  it('keeps an empty destination so the callback can pick the home path', () => {
    expect(callbackUrl('https://app.test', '', 'oauth')).toBe(
      'https://app.test/auth/callback?next=&flow=oauth',
    );
  });

  it('encodes a destination that could otherwise inject parameters', () => {
    expect(
      callbackUrl('https://app.test', '/x?flow=reset&y=1', 'confirm'),
    ).toBe(
      'https://app.test/auth/callback?next=%2Fx%3Fflow%3Dreset%26y%3D1&flow=confirm',
    );
  });
});

describe('parseAuthFlow', () => {
  it.each(['oauth', 'confirm', 'reset'] as const)('accepts %s', (flow) => {
    expect(parseAuthFlow(flow)).toBe(flow);
  });

  it.each([null, undefined, '', 'OAUTH', 'reset ', '<script>', 'constructor'])(
    'rejects %j',
    (raw) => {
      expect(parseAuthFlow(raw)).toBeNull();
    },
  );
});

describe('authErrorPath', () => {
  it('carries a known reason', () => {
    expect(authErrorPath('reset')).toBe('/auth/error?reason=reset');
  });

  it('falls back to the plain error page', () => {
    expect(authErrorPath(null)).toBe('/auth/error');
  });
});
