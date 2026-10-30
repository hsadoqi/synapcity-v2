import type { IdentityProvider, ProviderOutcome } from '../../types';

/**
 * A controlled identity provider for tests: it answers with the outcomes it
 * is given (no session by default) and counts how often each question was
 * asked.
 */
export function fakeIdentityProvider(
  outcomes: { claims?: ProviderOutcome; user?: ProviderOutcome } = {},
): IdentityProvider & { calls: { claims: number; user: number } } {
  const calls = { claims: 0, user: 0 };
  return {
    calls,
    async claims() {
      calls.claims += 1;
      return outcomes.claims ?? { kind: 'none' };
    },
    async user() {
      calls.user += 1;
      return outcomes.user ?? { kind: 'none' };
    },
  };
}
