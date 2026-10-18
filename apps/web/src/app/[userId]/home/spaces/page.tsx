import { SpacesContent } from '@/features/spaces/components/spaces-content';
import { requireOwner } from '@/lib/access/require-owner';

export default async function SpacesPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireOwner((await params).userId);

  return <SpacesContent />;
}
