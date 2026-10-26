import { redirect } from 'next/navigation';

import { requireOwner } from '../../../src/lib/access/require-owner';
import { homePathFor } from '../../../src/lib/routing/user-paths';

/** The user's own root has no page of its own: it leads to their home. */
export default async function Page({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  await requireOwner(userId);
  redirect(homePathFor(userId));
}
