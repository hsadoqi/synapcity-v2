import {
  AuthApiError,
  AuthRetryableFetchError,
  AuthSessionMissingError,
} from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

import { classifyAuthError } from './auth-errors';

describe('classifyAuthError', () => {
  it('is signed-out when there is no session', () => {
    expect(classifyAuthError(new AuthSessionMissingError())).toEqual({
      kind: 'signed-out',
    });
  });

  it('is unavailable when the service cannot be reached', () => {
    expect(
      classifyAuthError(new AuthRetryableFetchError('fetch failed', 0)),
    ).toEqual({ kind: 'unavailable' });
  });

  it('carries the code of any other error, never its message', () => {
    expect(
      classifyAuthError(
        new AuthApiError('secret', 422, 'manual_linking_disabled'),
      ),
    ).toStrictEqual({
      kind: 'provider-error',
      code: 'manual_linking_disabled',
    });
  });
});
