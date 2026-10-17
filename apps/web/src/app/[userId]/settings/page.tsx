import type { Metadata } from 'next';

import { PendingEmailProvider } from '@/features/auth/client';
import { getPendingEmail } from '@/features/auth/server/session';
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
  // Only this page needs it, and it costs a call to the provider.
  const pendingEmail = await getPendingEmail();

  return (
    <PendingEmailProvider pendingEmail={pendingEmail}>
      <SettingsContent name={name} />
    </PendingEmailProvider>
  );
}
