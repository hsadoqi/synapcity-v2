import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@synapcity/frontend-ui/core/empty';
import { LayoutDashboardIcon } from 'lucide-react';

/** Shown on a dashboard with no widgets; read-only, it does not point at editing. */
export function DashboardEmptyState({
  readOnly = false,
}: {
  readOnly?: boolean;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LayoutDashboardIcon />
        </EmptyMedia>
        <EmptyTitle>No widgets yet</EmptyTitle>
        <EmptyDescription>
          {readOnly
            ? 'Editing dashboards is not available yet.'
            : 'Turn on Edit layout and add one from the panel.'}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
