import { NextCollectionNavigation } from '@synapcity/frontend-collection/next';

import { requireOwner } from '@/lib/access/require-owner';
import { createMetadata } from '@synapcity/frontend-site/metadata';
import { Metadata } from 'next';

export const metadata: Metadata = createMetadata({
  title: 'Synapcity',
  description: 'A connected workspace for thinking, planning, and doing.',
  siteUrl: process.env.SITE_URL,
});

export default async function UserLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ userId: string }>;
}) {
  await requireOwner((await params).userId);

  return <NextCollectionNavigation>{children}</NextCollectionNavigation>;
}
