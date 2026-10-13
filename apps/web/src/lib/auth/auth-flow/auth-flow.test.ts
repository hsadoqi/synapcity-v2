import { describe, expect, it } from 'vitest';

import { authErrorPath, parseAuthFlow } from './auth-flow';

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
