'use client';

import { useCurrentUser } from '@/components/auth/provider/user-provider';

export type CurrentUserProfile = {
  name: string | null;
  imageUrl: string | null;
};

/**
 * Display-only profile of the signed-in user, read from the verified JWT
 * claims (`getClaims`, not `getSession`, per ADR-0006). Never use it to
 * authorize anything: the server checks that itself.
 */
export function useCurrentUserProfile(): CurrentUserProfile {
  const { name, imageUrl } = useCurrentUser() ?? {};

  return {
    name: name ?? null,
    imageUrl: imageUrl ?? null,
  };
}
