import { SpaceDetails } from '@/features/spaces/components/space-details';
import { getSpace } from '@/features/spaces/server/get-space';
import { requireOwner } from '@/lib/access/require-owner';

export default async function SpaceShowPage({
  params,
}: {
  params: Promise<{ userId: string; spaceId: string }>;
}) {
  const { userId, spaceId } = await params;
  await requireOwner(userId);
  const space = await getSpace(spaceId);

  return <SpaceDetails space={space} />;
}
