'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@synapcity/frontend-ui/core/avatar';

import { useCurrentUser } from '@/features/auth/client/user-provider';

function initialsOf(name: string | null): string {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export function CurrentUserAvatar() {
  const { name, imageUrl } = useCurrentUserProfile();

  return (
    <Avatar>
      {imageUrl && <AvatarImage src={imageUrl} alt={name ?? 'Your avatar'} />}
      <AvatarFallback>{initialsOf(name)}</AvatarFallback>
    </Avatar>
  );
}
