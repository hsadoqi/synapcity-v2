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
import { getAccountPreferences } from '@/features/settings/server/account-preferences';
import { saveAccountPreferences } from '@/features/settings/server/actions/preferences-actions';
import { SettingsContent } from '@/features/settings/settings-content';

export const metadata: Metadata = { title: 'Account settings' };

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { kind, claims } = await requireOwner((await params).userId);
  const { name } = profileFromClaims(claims);
  // Only this page needs these, and they cost a call to the provider (made
  // once: both read the same memoized lookup). In fixture mode none of them
  // reaches Supabase: there is no pending email, no linked account and no row.
  const [pendingEmail, accounts, stored] = await Promise.all([
    getPendingEmail(),
    getConnectedAccounts(),
    getAccountPreferences(claims.sub),
  ]);
  // A failed read leaves `stored` undefined: the page then works from browser
  // storage alone and saves nothing to the account this visit.
  const account = stored && { stored, save: saveAccountPreferences };

  return (
    <PendingEmailProvider pendingEmail={pendingEmail}>
      <ConnectedAccountsProvider accounts={accounts}>
        <SettingsContent
          name={name}
          account={account}
          draftScope={claims.sub}
          notice={kind === 'fixture' ? FIXTURE_MESSAGE : undefined}
        />
      </ConnectedAccountsProvider>
    </PendingEmailProvider>
  );
}
