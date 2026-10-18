import { SpacesCollection } from '@/features/spaces/components/spaces-collection';
import { getSpaces } from '@/features/spaces/server/get-spaces';
import { requireOwner } from '@/lib/access/require-owner';

export default async function SpacesPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  await requireOwner(userId);
  const spaces = await getSpaces();

  return <SpacesCollection spaces={spaces} userId={userId} />;
}
