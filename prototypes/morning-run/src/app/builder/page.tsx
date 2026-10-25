import type { Metadata } from 'next';

import { BuilderScreen } from '@/components/builder/builder-screen';

export const metadata: Metadata = { title: 'Build a run' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  return <BuilderScreen editId={edit} />;
}
