'use client';

import { FieldGroup } from '@synapcity/frontend-ui/core/field';

import { ProfileSummary } from '@synapcity/features-account/frontend';
import { updateAvatar } from '@/features/account/server/actions/avatar-actions';
import { updateName } from '@/features/account/server/actions/name-actions';
import { signInHref } from '@/lib/routing/sign-in-href';
import { useCurrentUser } from '@synapcity/features-auth/frontend';
import {
  ConnectedAccounts,
  DeleteAccount,
  EmailChange,
  PasswordReset,
} from '@/features/auth/components';
import {
  SettingsAccordion,
  SettingsAccordionItem,
  SettingsTabShell,
} from '@synapcity/features-settings/frontend';

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
        // Capped like SettingRow: these rows come from the auth and account
        // features, so the width is set here rather than in them.
        <SettingsAccordion>
          <SettingsAccordionItem value="profile" title="Profile">
            <FieldGroup className="max-w-3xl">
              <ProfileSummary
                name={user.name ?? ''}
                imageUrl={user.imageUrl}
                actions={{ updateName, updateAvatar }}
                signInHref={signInHref}
              />
            </FieldGroup>
          </SettingsAccordionItem>
          {/* Sign-in details belong to the auth feature. */}
          <SettingsAccordionItem value="sign-in" title="Sign-in">
            <FieldGroup className="max-w-3xl">
              <EmailChange email={user.email} />
              <PasswordReset />
              <ConnectedAccounts />
            </FieldGroup>
          </SettingsAccordionItem>
          {/* Last, and apart: it cannot be undone. */}
          <SettingsAccordionItem value="delete" title="Danger zone">
            <FieldGroup className="max-w-3xl">
              <DeleteAccount email={user.email} />
            </FieldGroup>
          </SettingsAccordionItem>
        </SettingsAccordion>
      ) : (
        <p className="text-sm text-muted-foreground">
          Sign in to manage your account.
        </p>
      )}
    </SettingsTabShell>
  );
};
