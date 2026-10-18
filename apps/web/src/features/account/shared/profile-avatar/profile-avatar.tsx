'use client';

import { User } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@synapcity/frontend-ui/core/avatar';

import { initialsOf } from '../initials';

/**
 * A person's picture. With no image it shows their initials, and with no name
 * either, a default person icon.
 */
export function ProfileAvatar({
  name,
  imageUrl,
  size,
  className,
}: {
  name: string | null;
  imageUrl: string | null;
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}) {
  const initials = initialsOf(name);

  return (
    <Avatar size={size} className={className}>
      {imageUrl && <AvatarImage src={imageUrl} alt={name ?? 'Your photo'} />}
      <AvatarFallback>
        {initials || (
          <>
            <User aria-hidden className="size-1/2" />
            <span className="sr-only">Default photo</span>
          </>
        )}
      </AvatarFallback>
    </Avatar>
  );
}
