'use client';

import { ProfileAvatar } from '@synapcity/features-account/frontend';
import { useCurrentUser } from '@/features/auth/client';

export function CurrentUserAvatar() {
  const user = useCurrentUser();

  return (
    <ProfileAvatar
      name={user?.name ?? null}
      imageUrl={user?.imageUrl ?? null}
    />
  );
}
