'use client';

import { Button } from '@synapcity/frontend-ui/core/button';

import type { ProfileAction, ProfileState } from '../../../../contracts';
import { AvatarField } from '../avatar-field';
import { ProfileFormShell } from '../../../next/components/profile-form-shell';

/** Edits just the photo. */
export function AvatarForm({
  name,
  imageUrl,
  onSaved,
  onCancel,
  autoFocus,
  action,
  signInHref,
}: {
  name: string | null;
  imageUrl: string | null;
  onSaved?: (state: ProfileState) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  /** The save action the host supplies (a Server Action in the web app). */
  action: ProfileAction;
  signInHref: (returnTo: string) => string;
}) {
  return (
    <ProfileFormShell
      action={action}
      signInHref={signInHref}
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
