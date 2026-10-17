'use client';

import { Button } from '@synapcity/frontend-ui/core/button';

import { updateAvatar } from '@/features/account/server/actions/avatar-actions';
import type { ProfileState } from '@/features/account/types';
import { AvatarField } from '../avatar-field';
import { ProfileFormShell } from '../../profile';

/** Edits just the photo. */
export function AvatarForm({
  name,
  imageUrl,
  onSaved,
  onCancel,
  autoFocus,
}: {
  name: string | null;
  imageUrl: string | null;
  onSaved?: (state: ProfileState) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}) {
  return (
    <ProfileFormShell
      action={updateAvatar}
      initialState={{ avatarUrl: imageUrl }}
      submitLabel="Upload photo"
      onSaved={onSaved}
      secondaryAction={
        onCancel && (
          <Button type="button" variant="outline" size="lg" onClick={onCancel}>
            Cancel
          </Button>
        )
      }
    >
      <AvatarField name={name} imageUrl={imageUrl} autoFocus={autoFocus} />
    </ProfileFormShell>
  );
}
