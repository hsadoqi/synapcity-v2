import type { Metadata } from 'next';

import { ProfileForm } from '@/features/account/components/profile-form';
import { FIXTURE_MESSAGE } from '@/lib/access/dev-fixture';
import { profileFromClaims } from '@/features/auth/shared/current-user';
import { requireOwner } from '@/lib/access/require-owner';

export const metadata: Metadata = { title: 'Account settings' };

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { kind, claims } = await requireOwner((await params).userId);
  const { name } = profileFromClaims(claims);

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1>Account settings</h1>
        <p className="text-sm text-muted-foreground">
          Update your account settings below. Changes to your name will be
          reflected across the site, but changes to your email or password will
          require you to re-verify your account.
        </p>
      </div>
      {kind === 'fixture' ? (
        <p className="text-sm text-muted-foreground">{FIXTURE_MESSAGE}</p>
      ) : (
        <ProfileForm defaultName={name ?? ''} />
      )}
    </div>
  );
}
