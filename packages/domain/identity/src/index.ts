export type { IdentityResult, VerifiedIdentity } from './identity-result';
export {
  ALREADY_YOUR_EMAIL,
  MIN_PASSWORD_LENGTH,
  PASSWORD_REQUIREMENTS,
  PASSWORD_TOO_SHORT_MESSAGE,
  emailRequestSchema,
  everyRefusal,
  firstRefusal,
  registrationSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
  type AuthFieldName,
} from './credentials';
export {
  MAX_NAME_LENGTH,
  checkName,
  displayNameOf,
  initialsOf,
  nameSchema,
  type NameInput,
} from './names';
export {
  AVATAR_ACCEPT,
  AVATAR_FILE_TYPES,
  MAX_AVATAR_BYTES,
  avatarFileSchema,
  isUploadedAvatar,
  type AvatarFileInput,
  type AvatarType,
} from './avatar';
export { profileSchema, type ProfileInput } from './profile';
export type { CurrentUser, DisplayProfile, User } from './current-user';
export {
  OAUTH_PROVIDERS,
  isOAuthProvider,
  providerLabel,
  type OAuthProvider,
} from './oauth-providers';
export {
  PROFILE_CONFIRMED_KEY,
  isNewAccount,
  isProfileConfirmed,
  needsProfileSetup,
} from './profile-setup';
