import { Button } from '@synapcity/frontend-ui/core/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@synapcity/frontend-ui/core/empty';
import { LayoutDashboardIcon, PlusIcon } from 'lucide-react';

/**
 * Shown on a dashboard with no widgets. Read-only, it does not point at
 * editing; otherwise **Add a widget** opens the palette (the host turns on
 * Edit layout and moves focus there).
 */
export function DashboardEmptyState({
  readOnly = false,
  onAdd,
}: {
  readOnly?: boolean;
  onAdd?: () => void;
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
            : 'Add a widget to start building this dashboard.'}
        </EmptyDescription>
      </EmptyHeader>
      {!readOnly && onAdd && (
        <EmptyContent>
          <Button onClick={onAdd}>
            <PlusIcon aria-hidden="true" />
            Add a widget
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
