import type { Metadata } from 'next';

import { RunPlayer } from '@/components/run/run-player';

export const metadata: Metadata = { title: 'Run' };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RunPlayer runId={id} />;
}
