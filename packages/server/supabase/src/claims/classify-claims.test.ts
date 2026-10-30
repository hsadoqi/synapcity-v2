import {
  AuthApiError,
  AuthInvalidJwtError,
  AuthRetryableFetchError,
  AuthSessionMissingError,
  AuthUnknownError,
} from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

import { classifyClaimsResponse, readClaims } from './classify-claims';

const claims = { sub: 'user-1' } as never;

describe('classifyClaimsResponse', () => {
  it('is verified when claims came back without an error', () => {
    expect(classifyClaimsResponse({ data: { claims }, error: null })).toEqual({
      status: 'verified',
      claims,
    });
  });

  it('is signed out when there is no token at all', () => {
    expect(classifyClaimsResponse({ data: null, error: null })).toEqual({
      status: 'signed-out',
    });
  });

  describe('signed-out shapes are never unavailable', () => {
    it.each([
      ['a missing session', new AuthSessionMissingError()],
      ['an invalid JWT', new AuthInvalidJwtError('bad signature')],
      [
        'a refresh token the service refused',
        new AuthApiError('gone', 400, 'refresh_token_not_found'),
      ],
      [
        'a session the service no longer knows',
        new AuthApiError('gone', 403, 'session_not_found'),
      ],
      [
        'an already-used refresh token',
        new AuthApiError('used', 400, 'refresh_token_already_used'),
      ],
    ])('%s', (_name, error) => {
      expect(classifyClaimsResponse({ data: null, error })).toEqual({
        status: 'signed-out',
      });
    });
  });

  describe('outage shapes are never signed-out', () => {
    it.each([
      ['a dropped connection', new AuthRetryableFetchError('fetch failed', 0)],
      ['a 503 from the service', new AuthRetryableFetchError('unavailable', 503)],
      ['a 5xx with a code', new AuthApiError('boom', 500, 'unexpected_failure')],
      ['a rate limit', new AuthApiError('slow down', 429, 'over_request_rate_limit')],
      ['a 4xx without a code', new AuthApiError('odd', 400, undefined)],
      ['an unknown failure', new AuthUnknownError('???', new Error('x'))],
    ])('%s', (_name, error) => {
      const result = classifyClaimsResponse({ data: null, error });
      expect(result.status).toBe('unavailable');
    });
  });

  it('carries only the code and status of an outage, never its message', () => {
    const result = classifyClaimsResponse({
      data: null,
      error: new AuthApiError('secret detail', 500, 'unexpected_failure'),
    });
    expect(result).toEqual({
      status: 'unavailable',
      failure: { code: 'unexpected_failure', status: 500 },
    });
    expect(JSON.stringify(result)).not.toContain('secret');
  });
});

describe('readClaims', () => {
  it('classifies what getClaims returns', async () => {
    await expect(
      readClaims({
        auth: { getClaims: async () => ({ data: null, error: null }) },
      } as never),
    ).resolves.toEqual({ status: 'signed-out' });
  });

  it('treats a thrown network error as unavailable, not as an exception', async () => {
    const result = await readClaims({
      auth: {
        getClaims: async () => {
          throw new TypeError('fetch failed');
        },
      },
    } as never);
    expect(result).toEqual({ status: 'unavailable', failure: {} });
  });
});
