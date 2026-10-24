export type { IdentityResult, VerifiedIdentity } from './types';
export {
  ALREADY_YOUR_EMAIL,
  AVATAR_ACCEPT,
  AVATAR_FILE_TYPES,
  MAX_AVATAR_BYTES,
  MAX_NAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  PASSWORD_REQUIREMENTS,
  PASSWORD_TOO_SHORT_MESSAGE,
  avatarFileSchema,
  emailRequestSchema,
  everyRefusal,
  firstRefusal,
  missingCharactersMessage,
  nameSchema,
  newPasswordSchema,
  profileSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from './schemas';
export type {
  AuthFieldName,
  AvatarType,
  AvatarFileInput,
  NameInput,
  ProfileInput,
} from './schemas';
export {
  NEW_ACCOUNT_DAYS,
  PROFILE_CONFIRMED_KEY,
  checkName,
  currentUserFromClaims,
  initialsOf,
  isNewAccount,
  isProfileConfirmed,
  isUploadedAvatar,
  needsProfileSetup,
  profileFromClaims,
  providerImageFrom,
} from './utils';
export type { CurrentUser, DisplayProfile } from './utils';
