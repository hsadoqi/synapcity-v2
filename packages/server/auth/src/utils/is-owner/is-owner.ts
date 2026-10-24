import type { IdentityResult } from '@synapcity/domain-identity/types';

/**
 * Whether the verified caller is the user `userId` names. The supplied id is
 * untrusted input (a route segment, a form field): it is only compared, never
 * taken as proof of who is asking.
 */
export function isOwner(result: IdentityResult, userId: string): boolean {
  return (
    result.status === 'verified' &&
    userId !== '' &&
    result.identity.userId === userId
  );
}
