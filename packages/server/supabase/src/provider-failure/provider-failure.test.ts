import { AuthApiError } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

import { toProviderFailure } from './provider-failure';

describe('toProviderFailure', () => {
  it('keeps an Auth error code and status only', () => {
    const error = new AuthApiError('secret message', 422, 'weak_password');

    expect(toProviderFailure(error)).toStrictEqual({
      code: 'weak_password',
      status: 422,
    });
  });

  it('keeps a PostgREST code and drops its message, details and hint', () => {
    const error = {
      message: 'new row violates row-level security policy',
      details: 'Failing row contains (secret)',
      hint: 'check your policy',
      code: '42501',
    };

    expect(toProviderFailure(error)).toStrictEqual({ code: '42501' });
  });

  it('keeps a Storage status without a code', () => {
    const error = Object.assign(new Error('Payload too large'), {
      status: 413,
      statusCode: '413',
    });

    expect(toProviderFailure(error)).toStrictEqual({ status: 413 });
  });

  it('leaves out absent and malformed keys', () => {
    expect(toProviderFailure({})).toStrictEqual({});
    expect(toProviderFailure({ code: 7, status: '500' })).toStrictEqual({});
  });
});
