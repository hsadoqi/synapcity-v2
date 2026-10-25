import type { Metadata } from 'next';

import { CompletionScreen } from '@/components/done/completion-screen';

export const metadata: Metadata = { title: 'Run complete' };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CompletionScreen entryId={id} />;
}
