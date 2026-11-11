import 'server-only';

export {
  createRequestClient,
  type RequestCookies,
  type ResponseHeadersSink,
  type SupabaseServerClient,
} from './request-client';
export {
  outcomeFromClaims,
  supabaseIdentityProvider,
} from './supabase-identity-provider';
export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from './database-types';
export { isRateLimited } from './auth-errors';
export {
  changeEmail,
  disconnectAccount,
  exchangeAuthCode,
  registerWithPassword,
  requestRecoveryEmail,
  resendEmailChange,
  resendSignupConfirmation,
  sendAccountDeletionLink,
  sendOwnPasswordReset,
  signInWithPassword,
  signOutSession,
  startAccountLink,
  startOAuthSignIn,
  updateOwnPassword,
  type AccountLinkOutcome,
  type CodeExchangeOutcome,
  type DeletionLinkOutcome,
  type DisconnectOutcome,
  type EmailChangeInput,
  type EmailChangeOutcome,
  type OAuthSignInOutcome,
  type OwnPasswordResetOutcome,
  type PasswordSignInOutcome,
  type PasswordUpdateOutcome,
  type RecoveryInput,
  type RecoveryOutcome,
  type RegistrationInput,
  type RegistrationOutcome,
  type ResendEmailChangeOutcome,
  type SignOutOutcome,
  type SignOutScope,
} from './auth-operations';
export { toProviderFailure, type ProviderFailure } from './provider-failure';
export {
  providerImageFrom,
  readProviderUser,
  type MetadataPatch,
  type ProviderUser,
  type ProviderUserResult,
} from './provider-user';
export {
  LINK_SIGN_IN_WINDOW_SECONDS,
  currentUserFromClaims,
  hasRecentLinkSignIn,
  hasRecentLinkSignInNow,
  profileFromClaims,
  type ClaimsProfile,
} from './session-claims';
