import 'server-only';

export type {
  IdentityProvider,
  IdentityVerification,
  ProviderFailure,
  ProviderOutcome,
} from './identity-provider';
export { isOwner } from './is-owner';
export { verifyIdentity, verifyIdentityWithProvider } from './verify-identity';
