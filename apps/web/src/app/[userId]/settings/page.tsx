import type { Metadata } from 'next';

import { ProfileForm } from '@/components/auth/profile/profile-form';
import { profileFromClaims } from '@/lib/auth/profile/profile';
import { requireOwner } from '@/lib/auth/require-owner/require-owner';

export const metadata: Metadata = { title: 'Account settings' };

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const claims = await requireOwner((await params).userId);
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
      <ProfileForm defaultName={name ?? ''} />
    </div>
  );
}
