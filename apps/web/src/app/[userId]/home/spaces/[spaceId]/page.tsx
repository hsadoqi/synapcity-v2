import { SpaceContent } from '@/features/spaces/components/space-content';
import { getSpace } from '@/features/spaces/server/get-space';
import { requireOwner } from '@/lib/access/require-owner';

export default async function SpaceShowPage({
  params,
}: {
  params: Promise<{ userId: string; spaceId: string }>;
}) {
  const { userId, spaceId } = await params;
  await requireOwner(userId);
  const awaitedSpace = await getSpace(spaceId);

  return <SpaceContent userId={userId} spaceItem={awaitedSpace} />;
}
