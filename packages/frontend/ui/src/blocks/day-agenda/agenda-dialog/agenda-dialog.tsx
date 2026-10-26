import {
  DialogPortalContainer,
  type DialogContainerTarget,
} from '@synapcity/frontend-ui/components/dialog-portal-container';
import type { ReactElement, ReactNode } from 'react';

export interface AgendaDialogProps {
  /** @default true */
  modal?: boolean;
  title: string;
  description: string;
  trigger: ReactElement;
  /** Dialog body. Without it, placeholder rows show the scrolling layout. */
  children?: ReactNode;
  /** @default 'body' */
  container?: DialogContainerTarget;
}

export const AgendaDialog = ({
  modal = true,
  title,
  description,
  trigger,
  container = 'body',
  children,
}: AgendaDialogProps) => (
  <DialogPortalContainer
    modal={modal}
    container={container}
    scrollable
    title={title}
    description={description}
    trigger={trigger}
  >
    <div
      data-testid="day-agenda-content"
      className="flex flex-col gap-2 pr-3 text-sm font-medium text-muted-foreground"
    >
      {children ??
        Array.from({ length: 24 }, (_, i) => (
          <p key={i}>Settings content goes here.</p>
        ))}
    </div>
  </DialogPortalContainer>
);
