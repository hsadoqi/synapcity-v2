'use client';

import { Button } from '@synapcity/frontend-ui/core/button';

import type { ProfileAction, ProfileState } from '../../../../contracts';
import { NameField } from '../name-field';
import { PersonNameFields } from '../person-name-fields';
import { ProfileFormShell } from '../../../next/components/profile-form-shell';

/** Edits the first, last and display names. */
export function NameForm({
  defaultFirstName,
  defaultLastName,
  defaultName,
  onSaved,
  onCancel,
  autoFocus,
  action,
  signInHref,
}: {
  defaultFirstName: string;
  defaultLastName: string;
  /** The current display name, or empty when there is none. */
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
      initialState={{
        firstName: defaultFirstName,
        lastName: defaultLastName,
        name: defaultName,
      }}
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
      <PersonNameFields
        defaultFirstName={defaultFirstName}
        defaultLastName={defaultLastName}
        autoFocus={autoFocus}
      />
      <NameField defaultName={defaultName} />
    </ProfileFormShell>
  );
}
