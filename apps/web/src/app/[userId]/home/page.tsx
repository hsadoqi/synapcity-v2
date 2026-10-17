import type { Metadata } from 'next';
import { LinkButton } from '@synapcity/frontend-ui/components/link-button';

import { CurrentUserAvatar } from '@/features/auth/components/current-user-avatar';
import { SignOutButton } from '@/features/auth/components/sign-out';
import { requireOwner } from '@/lib/access/require-owner';

export const metadata: Metadata = { title: 'Home' };

export default async function HomePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  // The proxy only knows someone is signed in; this checks it is this user.
  const claims = await requireOwner((await params).userId);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
      <CurrentUserAvatar />
      <h1>You are signed in</h1>
      <p className="text-sm text-muted-foreground">{claims.email}</p>
      <LinkButton href="/auth/update-password" variant="link" size="lg">
        Set or change your password
      </LinkButton>
      <SignOutButton />
    </div>
  );
}
