'use client';

import { Separator } from '@synapcity/frontend-ui/core/separator';
import { FieldGroup } from '@synapcity/frontend-ui/core/field';

import { ProfileSummary } from '@/features/account/components/profile';
import { useCurrentUser } from '@/features/auth/client';
import {
  ConnectedAccounts,
  DeleteAccount,
  EmailChange,
  PasswordReset,
} from '@/features/auth/components';
import { SettingsTabShell } from '../../shared';

/**
 * The signed-in person's profile. The name and photo belong to the account
 * feature and save to the account, not to the browser preferences the other
 * tabs edit. The email is a sign-in detail, so changing it belongs to the auth
 * feature: it asks for a confirmation and shows the change as waiting until it
 * is confirmed.
 */
export const AccountSettings = () => {
  const user = useCurrentUser();

  return (
    <SettingsTabShell
      title="Account settings"
      description="Manage your account information and preferences."
    >
      {user ? (
        <>
          <FieldGroup>
            <ProfileSummary name={user.name ?? ''} imageUrl={user.imageUrl} />
          </FieldGroup>
          <Separator />
          {/* Sign-in details belong to the auth feature. */}
          <FieldGroup>
            <EmailChange email={user.email} />
            <PasswordReset />
            <ConnectedAccounts />
          </FieldGroup>
          <Separator />
          {/* Last, and apart: it cannot be undone. */}
          <FieldGroup>
            <DeleteAccount email={user.email} />
          </FieldGroup>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Sign in to manage your account.
        </p>
      )}
    </SettingsTabShell>
  );
};
