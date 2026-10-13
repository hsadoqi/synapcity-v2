import { requireOwner } from '@/lib/auth/require-owner/require-owner';

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
