'use client';

import { Button } from '@synapcity/frontend-ui/core/button';

import { updateName } from '@/features/account/server/actions';
import type { ProfileState } from '@/features/account/types';
import { NameField } from './name-field';
import { ProfileFormShell } from '../profile/profile-form-shell';

/** Edits just the display name. */
export function NameForm({
  defaultName,
  onSaved,
  onCancel,
  autoFocus,
}: {
  defaultName: string;
  onSaved?: (state: ProfileState) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}) {
  return (
    <ProfileFormShell
      action={updateName}
      initialState={{ name: defaultName }}
      submitLabel="Save changes"
      onSaved={onSaved}
      secondaryAction={
        onCancel && (
          <Button type="button" variant="outline" size="lg" onClick={onCancel}>
            Cancel
          </Button>
        )
      }
    >
      <NameField defaultName={defaultName} autoFocus={autoFocus} />
    </ProfileFormShell>
  );
}
