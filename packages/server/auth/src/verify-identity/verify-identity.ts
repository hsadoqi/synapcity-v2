import type { IdentityResult } from '@synapcity/domain-identity';

import type {
  IdentityProvider,
  IdentityVerification,
  ProviderFailure,
  ProviderOutcome,
} from '../identity-provider';

const SIGNED_OUT: IdentityResult = { status: 'signed-out' };

function verifiedOrNull(outcome: ProviderOutcome): IdentityResult | null {
  if (outcome.kind !== 'user') return null;
  const { userId } = outcome;
  if (typeof userId !== 'string' || userId === '') return null;
  return { status: 'verified', identity: { userId } };
}

/** The error detail of a failed outcome, without the `kind` tag. */
function failureOf(outcome: ProviderOutcome): ProviderFailure | undefined {
  if (outcome.kind !== 'refused' && outcome.kind !== 'unreachable') {
    return undefined;
  }
  const { kind, ...failure } = outcome;
  void kind;
  return failure;
}

function withFailure(
  result: IdentityResult,
  outcome: ProviderOutcome,
): IdentityVerification {
  const failure = failureOf(outcome);
  return failure ? { result, failure } : { result };
}

/**
 * The verified caller from locally verified session claims, for reads (pages,
 * route handlers). Anything but a user with an id is signed out, including
 * provider errors: a claims check never reports `unavailable`.
 */
export async function verifyIdentity(
  provider: Pick<IdentityProvider, 'claims'>,
): Promise<IdentityVerification> {
  const outcome = await provider.claims();
  return withFailure(verifiedOrNull(outcome) ?? SIGNED_OUT, outcome);
}

/**
 * The verified caller from the provider's own record, for writes that need
 * fresh user data (ADR-0006). An unreachable provider is `unavailable`, so
 * an outage is not mistaken for a signed-out session.
 */
export async function verifyIdentityWithProvider(
  provider: Pick<IdentityProvider, 'user'>,
): Promise<IdentityVerification> {
  const outcome = await provider.user();
  const verified = verifiedOrNull(outcome);
  if (verified) return { result: verified };
  return withFailure(
    outcome.kind === 'unreachable' ? { status: 'unavailable' } : SIGNED_OUT,
    outcome,
  );
}
