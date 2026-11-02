import type { IdentityResult } from '@synapcity/domain-identity/types';

/** A provider error's detail, kept for logging by code and status only. */
export type ProviderFailure = { code?: string; status?: number };

/**
 * What a provider says when asked who the caller is, in provider-neutral
 * terms. `unreachable` means the provider could not be reached (retryable);
 * `refused` means it answered with an error.
 */
export type ProviderOutcome =
  | { kind: 'user'; userId: string }
  | { kind: 'none' }
  | ({ kind: 'unreachable' } & ProviderFailure)
  | ({ kind: 'refused' } & ProviderFailure);

/**
 * The two questions the boundary asks a provider. A host builds one per
 * request from a request-bound client; tests use `fakeIdentityProvider`.
 */
export interface IdentityProvider {
  /** Locally verified session claims (Supabase `getClaims`). */
  claims(): Promise<ProviderOutcome>;
  /** The provider's own record of the user, a network call (Supabase `getUser`). */
  user(): Promise<ProviderOutcome>;
}

/** The boundary's answer, with the provider error's detail when there was one. */
export type IdentityVerification = {
  result: IdentityResult;
  failure?: ProviderFailure;
};
