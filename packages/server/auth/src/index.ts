import 'server-only';

export type {
  IdentityProvider,
  IdentityVerification,
  ProviderFailure,
  ProviderOutcome,
} from './types';
export { isOwner, verifyIdentity, verifyIdentityWithProvider } from './utils';
