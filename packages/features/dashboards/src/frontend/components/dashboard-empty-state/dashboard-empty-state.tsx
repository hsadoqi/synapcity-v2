import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@synapcity/frontend-ui/core/empty';
import { LayoutDashboardIcon } from 'lucide-react';

export function DashboardEmptyState() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LayoutDashboardIcon />
        </EmptyMedia>
        <EmptyTitle>No widgets yet</EmptyTitle>
        <EmptyDescription>
          Turn on Edit layout and add one from the panel.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
