/**
 * Who the verified caller is. Built only from a provider's verification of
 * the session, never from display data (names, emails, `user_metadata`) or
 * from an ID the caller supplied.
 */
export type VerifiedIdentity = {
  /** The provider's subject for this user (Supabase `sub`). */
  userId: string;
};

/**
 * The answer to "who is asking?". `unavailable` means the provider could not
 * be reached and the caller may try again; it is not a signed-out session.
 */
export type IdentityResult =
  | { status: 'verified'; identity: VerifiedIdentity }
  | { status: 'signed-out' }
  | { status: 'unavailable' };
