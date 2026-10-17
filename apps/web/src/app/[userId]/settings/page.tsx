import type { Metadata } from 'next';

import {
  ConnectedAccountsProvider,
  PendingEmailProvider,
} from '@/features/auth/client';
import {
  getConnectedAccounts,
  getPendingEmail,
} from '@/features/auth/server/session';
import { profileFromClaims } from '@/features/auth/shared';
import { requireOwner } from '@/lib/access/require-owner';
import { SettingsContent } from '@/features/settings/shared/settings-page/settings-content';

export const metadata: Metadata = { title: 'Account settings' };

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const claims = await requireOwner((await params).userId);
  const { name } = profileFromClaims(claims);
  // Only this page needs these, and they cost a call to the provider (made
  // once: both read the same memoized lookup).
  const [pendingEmail, accounts] = await Promise.all([
    getPendingEmail(),
    getConnectedAccounts(),
  ]);

  return (
    <PendingEmailProvider pendingEmail={pendingEmail}>
      <ConnectedAccountsProvider accounts={accounts}>
        <SettingsContent name={name} />
      </ConnectedAccountsProvider>
    </PendingEmailProvider>
  );
}
