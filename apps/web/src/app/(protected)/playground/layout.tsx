import type { ReactNode } from 'react';
import { getSpaceSource } from '@/lib/spaces';
import { ContextSidebarShell } from './context-sidebar-shell';
import type { PlaygroundSidebarContext } from './main-sidebar';

export default async function PlaygroundLayout({
  children,
}: {
  children: ReactNode;
}) {
  const source = await getSpaceSource();
  const spaces = await source.listNavItems();
  const contexts: PlaygroundSidebarContext[] = await Promise.all(
    spaces.map(async (space) => {
      const [documents, dashboards] = await Promise.all([
        source.listDocuments(space.id),
        source.listDashboards(space.id),
      ]);

      return {
        id: space.id,
        label: space.name,
        icon: space.icon,
        groups: [
          {
            id: 'documents',
            label: 'Documents',
            items: documents.map((document) => ({
              id: document.id,
              label: document.name,
              icon: document.icon ?? 'file-text',
            })),
            empty: 'No documents in this space',
          },
          {
            id: 'dashboards',
            label: 'Dashboards',
            items: dashboards.map((dashboard) => ({
              id: dashboard.id,
              label: dashboard.name,
              icon: dashboard.icon ?? 'layout-dashboard',
            })),
            empty: 'No dashboards in this space',
          },
        ],
      };
    }),
  );

  return (
    <div className="min-h-0 flex-1 p-4">
      <ContextSidebarShell contexts={contexts}>{children}</ContextSidebarShell>
    </div>
  );
}
