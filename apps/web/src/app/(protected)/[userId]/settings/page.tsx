import type { Metadata } from 'next';

import {
  ConnectedAccountsProvider,
  PendingEmailProvider,
} from '@synapcity/features-auth/frontend';
import {
  getConnectedAccounts,
  getPendingEmail,
} from '@/features/auth/server/session';
import { profileFromClaims } from '@synapcity/domain-identity';
import { FIXTURE_MESSAGE } from '@/lib/access/dev-fixture';
import { requireOwner } from '@/lib/access/require-owner';
import { SettingsContent } from '@/features/settings/settings-content';

export const metadata: Metadata = { title: 'Account settings' };

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { kind, claims } = await requireOwner((await params).userId);
  const { name } = profileFromClaims(claims);
  // Only this page needs these, and they cost a call to the provider. In
  // fixture mode neither reaches Supabase. Preferences come from the root
  // runtime, which the layout feeds with the account row.
  const [pendingEmail, accounts] = await Promise.all([
    getPendingEmail(),
    getConnectedAccounts(),
  ]);

  return (
    <PendingEmailProvider pendingEmail={pendingEmail}>
      <ConnectedAccountsProvider accounts={accounts}>
        <SettingsContent
          name={name}
          draftScope={claims.sub}
          notice={kind === 'fixture' ? FIXTURE_MESSAGE : undefined}
        />
      </ConnectedAccountsProvider>
    </PendingEmailProvider>
  );
}
