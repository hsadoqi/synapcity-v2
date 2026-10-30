import 'server-only';

export type {
  IdentityProvider,
  IdentityVerification,
  ProviderFailure,
  ProviderOutcome,
} from './types';
export { isOwner } from './utils/is-owner';
export {
  verifyIdentity,
  verifyIdentityWithProvider,
} from './utils/verify-identity';
