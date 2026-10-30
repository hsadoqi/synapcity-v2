import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@synapcity/frontend-ui/core/empty';
import { NamedIcon } from '../icon-by-name';
import { Workspace } from '../types';

export function EmptyWorkspace({ workspace }: { workspace: Workspace }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <NamedIcon name={workspace.icon} aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{workspace.name} is empty</EmptyTitle>
        <EmptyDescription>
          No documents or dashboards are filed here yet.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
