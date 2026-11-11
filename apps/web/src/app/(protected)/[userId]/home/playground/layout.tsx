import type { ReactNode } from 'react';
import { requireOwner } from '@/lib/access/require-owner';
import { ContextSidebarShell } from './context-sidebar-shell';
import { loadPlaygroundContexts } from './playground-contexts';

export default async function PlaygroundLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ userId: string }>;
}) {
  // Layouts and pages render in parallel, so this one checks the owner itself
  // before it reads their Spaces.
  await requireOwner((await params).userId);
  const contexts = await loadPlaygroundContexts();

  return (
    <div className="min-h-0 flex-1 p-4">
      <ContextSidebarShell contexts={contexts}>{children}</ContextSidebarShell>
    </div>
  );
}
