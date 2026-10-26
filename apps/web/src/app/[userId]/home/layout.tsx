import { HomeShell } from '@/features/home/components/home-shell';
import { HomeProviders } from '@/features/home/providers/home-providers';
import { createMetadata } from '@synapcity/frontend-site/metadata';
import { Metadata } from 'next/types';

export const metadata: Metadata = createMetadata({
  title: 'Synapcity',
  description: 'A connected workspace for thinking, planning, and doing.',
  siteUrl: process.env.SITE_URL,
});

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HomeProviders>
      <HomeShell>{children}</HomeShell>
    </HomeProviders>
  );
}
