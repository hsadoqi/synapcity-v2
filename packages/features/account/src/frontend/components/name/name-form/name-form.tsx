'use client';

import { Button } from '@synapcity/frontend-ui/core/button';

import type { ProfileAction, ProfileState } from '../../../../contracts';
import { NameField } from '../name-field';
import { ProfileFormShell } from '../../../next/profile-form-shell';

/** Edits just the display name. */
export function NameForm({
  defaultName,
  onSaved,
  onCancel,
  autoFocus,
  action,
  signInHref,
}: {
  defaultName: string;
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
