import type { Metadata } from 'next';

import { requireOwner } from '../../../../src/lib/access/require-owner';
import { HomePageView } from '../../../../src/features/home/components/home-page';
import {
  fixtureItems,
  fixturePinned,
} from '../../../../src/features/home/lib/overview.fixtures';

export const metadata: Metadata = { title: 'Home' };

export default async function HomePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  // The proxy only knows someone is signed in; this checks it is this user.
  const { userId } = await params;
  await requireOwner(userId);
  //   return (
  //     <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
  //       <CurrentUserAvatar />
  //       <h1>You are signed in</h1>
  //       <p className="text-sm text-muted-foreground">{claims.email}</p>
  //       <LinkButton href="/auth/update-password" variant="link" size="lg">
  //         Set or change your password
  //       </LinkButton>
  //       <SignOutButton />
  //     </div>
  //   );
  // Home has no real history source yet, so it shows fixtures labelled as
  // sample content rather than passing them off as the person's own work.
  return (
    <HomePageView
      state="populated"
      sample
      items={fixtureItems}
      pinned={fixturePinned}
      dateLabel="Today"
      dateTime={new Date().toISOString()}
      userId={userId}
    />
  );
}
