'use client';

import { displayNameOf } from '@synapcity/domain-identity';

import type { ProfileAction } from '../../../../contracts';
import { AvatarField } from '../../avatar';
import { NameField, PersonNameFields } from '../../name';
import { ProfileFormShell } from '../../../next/components/profile-form-shell';

/**
 * Lets a new account confirm its names and photo. A first name is required to
 * finish; the last name, the display name and the photo are optional, and the
 * photo defaults to the one Google or GitHub supplied. The caller decides
 * where to go next through `onComplete`, so the auth flow can place this
 * wherever it needs to.
 */
export function ProfileSetupForm({
  defaultFirstName,
  defaultLastName,
  defaultName,
  imageUrl,
  onComplete,
  action,
  signInHref,
}: {
  defaultFirstName: string;
  defaultLastName: string;
  /** The display name to start from, or empty. */
  defaultName: string;
  imageUrl: string | null;
  onComplete: () => void;
  /** The action the host supplies for completing the profile. */
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
        avatarUrl: imageUrl,
      }}
      submitLabel="Continue"
      onSaved={onComplete}
    >
      <PersonNameFields
        defaultFirstName={defaultFirstName}
        defaultLastName={defaultLastName}
      />
      <NameField defaultName={defaultName} />
      <AvatarField
        name={
          displayNameOf({
            displayName: defaultName,
            firstName: defaultFirstName,
          }) ?? ''
        }
        imageUrl={imageUrl}
        canRemove={false}
      />
    </ProfileFormShell>
  );
}
