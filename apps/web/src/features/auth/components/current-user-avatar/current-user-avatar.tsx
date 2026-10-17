'use client';

import { ProfileAvatar } from '@/features/account/shared/profile-avatar';
import { useCurrentUser } from '@/features/auth/client/user-provider';

export function CurrentUserAvatar() {
  const user = useCurrentUser();

  return (
    <ProfileAvatar
      name={user?.name ?? null}
      imageUrl={user?.imageUrl ?? null}
    />
  );
}
