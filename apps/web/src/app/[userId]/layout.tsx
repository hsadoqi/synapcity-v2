import { requireOwner } from '@/lib/access/require-owner';

export default async function UserLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ userId: string }>;
}) {
  await requireOwner((await params).userId);

  return children;
}
