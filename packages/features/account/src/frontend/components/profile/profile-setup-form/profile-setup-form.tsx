'use client';

import type { ProfileAction } from '../../../../contracts';
import { AvatarField } from '../../avatar';
import { NameField } from '../../name';
import { ProfileFormShell } from '../../../next/components/profile-form-shell';

/**
 * Lets a new account confirm its name and photo. Both usually arrive from
 * Google or GitHub, so they are prefilled and the photo is optional. The
 * caller decides where to go next through `onComplete`, so the auth flow can
 * place this wherever it needs to.
 */
export function ProfileSetupForm({
  defaultName,
  imageUrl,
  onComplete,
  action,
  signInHref,
}: {
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
      initialState={{ name: defaultName, avatarUrl: imageUrl }}
      submitLabel="Continue"
      onSaved={onComplete}
    >
      <NameField defaultName={defaultName} />
      <AvatarField name={defaultName} imageUrl={imageUrl} canRemove={false} />
    </ProfileFormShell>
  );
}
