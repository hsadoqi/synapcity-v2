import {
  AuthApiError,
  AuthInvalidJwtError,
  AuthRetryableFetchError,
  AuthSessionMissingError,
  AuthUnknownError,
  AuthWeakPasswordError,
} from '@supabase/supabase-js';
import { verifyIdentityWithProvider } from '@synapcity/server-auth';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { readClaims } from '../claims';
import { readProviderUser } from '../provider-user';
import type { SupabaseServerClient } from '../request-client';
import { supabaseIdentityProvider } from '../supabase-identity-provider';
import {
  AUTH_DEADLINE_MS,
  classifyAuthError,
  classifyAuthFailure,
  identityFailure,
  isRateLimited,
  withDeadline,
} from './auth-errors';

/** A client whose `getClaims` and `getUser` both fail the same way. */
function failingClient(failure: { returns: unknown } | { throws: unknown }) {
  const answer = async () => {
    if ('throws' in failure) throw failure.throws;
    return { data: { claims: null, user: null }, error: failure.returns };
  };
  return {
    auth: { getClaims: vi.fn(answer), getUser: vi.fn(answer) },
  } as unknown as SupabaseServerClient;
}

type Expected = {
  /** `readClaims`, provider `claims()`, provider `user()`, `readProviderUser`. */
  identity: 'signed-out' | 'unavailable';
  operations: ReturnType<typeof classifyAuthError>;
};

const SIGNED_OUT: Expected = {
  identity: 'signed-out',
  operations: { kind: 'signed-out' },
};
const UNAVAILABLE: Expected = {
  identity: 'unavailable',
  operations: { kind: 'unavailable' },
};
const refused = (code: string | undefined, identity: Expected['identity']) => ({
  identity,
  operations: { kind: 'provider-error', code } as const,
});

/** The regression matrix: one input, the outcome in every context. */
const MATRIX: [string, { returns: unknown } | { throws: unknown }, Expected][] =
  [
    [
      'a missing session',
      { returns: new AuthSessionMissingError() },
      SIGNED_OUT,
    ],
    [
      'session_not_found as an API error',
      { returns: new AuthApiError('gone', 403, 'session_not_found') },
      SIGNED_OUT,
    ],
    [
      'an invalid JWT',
      { returns: new AuthInvalidJwtError('bad signature') },
      SIGNED_OUT,
    ],
    [
      'a 400 refusal with a code',
      { returns: new AuthApiError('x', 400, 'refresh_token_not_found') },
      refused('refresh_token_not_found', 'signed-out'),
    ],
    [
      'a 401 refusal with a code',
      { returns: new AuthApiError('x', 401, 'bad_jwt') },
      refused('bad_jwt', 'signed-out'),
    ],
    [
      'a 403 refusal with a code',
      { returns: new AuthApiError('x', 403, 'user_not_found') },
      refused('user_not_found', 'signed-out'),
    ],
    [
      'a 4xx without a code',
      { returns: new AuthApiError('x', 400, undefined) },
      refused(undefined, 'unavailable'),
    ],
    [
      'a 429 rate limit',
      { returns: new AuthApiError('x', 429, 'over_request_rate_limit') },
      refused('over_request_rate_limit', 'unavailable'),
    ],
    [
      'a 429 without a code',
      { returns: new AuthApiError('x', 429, undefined) },
      refused(undefined, 'unavailable'),
    ],
    [
      'a dropped connection (status 0)',
      { returns: new AuthRetryableFetchError('fetch failed', 0) },
      UNAVAILABLE,
    ],
    ['a 500', { returns: new AuthRetryableFetchError('x', 500) }, UNAVAILABLE],
    ['a 503', { returns: new AuthRetryableFetchError('x', 503) }, UNAVAILABLE],
    ['a 522', { returns: new AuthRetryableFetchError('x', 522) }, UNAVAILABLE],
    [
      'a 5xx API error auth-js did not mark retryable',
      { returns: new AuthApiError('x', 505, 'unexpected_failure') },
      UNAVAILABLE,
    ],
    [
      'a body that was not JSON',
      { returns: new AuthUnknownError('???', new SyntaxError('x')) },
      UNAVAILABLE,
    ],
    [
      'a thrown TypeError',
      { throws: new TypeError('fetch failed') },
      UNAVAILABLE,
    ],
  ];

describe('the authentication-error matrix', () => {
  describe.each(MATRIX)('%s', (_name, failure, expected) => {
    const providerKind =
      expected.identity === 'signed-out' ? 'refused' : 'unreachable';
    const sample = 'throws' in failure ? failure.throws : failure.returns;

    it('readClaims', async () => {
      const result = await readClaims(failingClient(failure));
      expect(result.status).toBe(expected.identity);
    });

    it('the identity provider claims()', async () => {
      const outcome = await supabaseIdentityProvider(
        failingClient(failure),
      ).claims();
      expect(outcome.kind).toBe(providerKind);
    });

    it('the identity provider user()', async () => {
      const outcome = await supabaseIdentityProvider(
        failingClient(failure),
      ).user();
      expect(outcome.kind).toBe(providerKind);
    });

    it('readProviderUser', async () => {
      const result = await readProviderUser(failingClient(failure));
      expect(result.kind).toBe(expected.identity);
    });

    it('classifyAuthError', () => {
      expect(classifyAuthError(sample)).toEqual(expected.operations);
    });

    // The two caller checks of Server Actions (`getCallerIdentity` builds on
    // the provider's `user()`, `getCaller` on `readProviderUser`) must agree.
    it('both caller checks give the same class', async () => {
      const viaBoundary = await verifyIdentityWithProvider(
        supabaseIdentityProvider(failingClient(failure)),
      );
      const viaRecord = await readProviderUser(failingClient(failure));
      expect(viaBoundary.result.status).toBe(viaRecord.kind);
    });
  });

  describe('an Auth service that never answers', () => {
    afterEach(() => vi.useRealTimers());

    const never = () =>
      ({
        auth: {
          getClaims: () => new Promise<never>(() => undefined),
          getUser: () => new Promise<never>(() => undefined),
        },
      }) as unknown as SupabaseServerClient;

    it.each([
      ['readClaims', async () => (await readClaims(never())).status],
      [
        'the identity provider claims()',
        async () => (await supabaseIdentityProvider(never()).claims()).kind,
      ],
      [
        'the identity provider user()',
        async () => (await supabaseIdentityProvider(never()).user()).kind,
      ],
      ['readProviderUser', async () => (await readProviderUser(never())).kind],
    ])('%s is unavailable after the deadline', async (_name, run) => {
      vi.useFakeTimers();
      const pending = run();
      await vi.advanceTimersByTimeAsync(AUTH_DEADLINE_MS);
      await expect(pending).resolves.toMatch(/^(unavailable|unreachable)$/);
    });

    it('carries a timeout code', async () => {
      vi.useFakeTimers();
      const user = readProviderUser(never());
      const provider = supabaseIdentityProvider(never()).user();
      await vi.advanceTimersByTimeAsync(AUTH_DEADLINE_MS);
      await expect(user).resolves.toEqual({
        kind: 'unavailable',
        failure: { code: 'timeout' },
      });
      await expect(provider).resolves.toEqual({
        kind: 'unreachable',
        code: 'timeout',
      });
    });
  });
});

describe('classifyAuthFailure', () => {
  it('keeps a rate limit apart from a refusal and an outage', () => {
    expect(
      classifyAuthFailure(
        new AuthApiError('slow', 429, 'over_email_send_rate_limit'),
      ),
    ).toEqual({
      class: 'rate-limited',
      code: 'over_email_send_rate_limit',
      failure: { code: 'over_email_send_rate_limit', status: 429 },
    });
  });

  it('treats a non-API Auth error with a code as rejected, not refused', () => {
    expect(
      classifyAuthFailure(new AuthWeakPasswordError('weak', 422, ['length'])),
    ).toMatchObject({ class: 'rejected', code: 'weak_password' });
    expect(
      identityFailure(new AuthWeakPasswordError('weak', 422, ['length'])).kind,
    ).toBe('unavailable');
  });

  it('carries the code and status only, never the message', () => {
    const sorted = classifyAuthFailure(
      new AuthApiError('secret detail', 403, 'bad_jwt'),
    );
    expect(sorted.failure).toEqual({ code: 'bad_jwt', status: 403 });
    expect(JSON.stringify(sorted)).not.toContain('secret');
  });

  it.each([null, undefined, 'text', { code: 'session_not_found' }])(
    'reads a non-Auth value (%j) as unavailable with no detail',
    (value) => {
      expect(classifyAuthFailure(value)).toEqual({
        class: 'unavailable',
        failure: {},
      });
    },
  );
});

describe('classifyAuthError', () => {
  it('carries the code of a refusal, never its message', () => {
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

describe('withDeadline', () => {
  afterEach(() => vi.useRealTimers());

  it('returns the answer and leaves no timer behind', async () => {
    vi.useFakeTimers();
    await expect(withDeadline(async () => 'answer', 10)).resolves.toBe(
      'answer',
    );
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects with what the call threw, including a synchronous throw', async () => {
    const thrown = new TypeError('boom');
    await expect(
      withDeadline(() => {
        throw thrown;
      }),
    ).rejects.toBe(thrown);
  });

  it('a late rejection after the deadline is not an unhandled rejection', async () => {
    vi.useFakeTimers();
    let reject!: (e: unknown) => void;
    const late = new Promise<never>((_, r) => (reject = r));
    const result = withDeadline(() => late, 10);
    await vi.advanceTimersByTimeAsync(10);
    await expect(result).resolves.toBe('deadline');
    reject(new TypeError('fetch failed'));
    await vi.advanceTimersByTimeAsync(0);
  });
});

describe('isRateLimited', () => {
  it.each(['over_email_send_rate_limit', 'over_request_rate_limit'])(
    'treats %s as rate limiting',
    (code) => {
      expect(isRateLimited(code)).toBe(true);
    },
  );

  it.each([undefined, '', 'invalid_credentials', 'user_already_exists'])(
    'does not treat %j as rate limiting',
    (code) => {
      expect(isRateLimited(code)).toBe(false);
    },
  );
});
