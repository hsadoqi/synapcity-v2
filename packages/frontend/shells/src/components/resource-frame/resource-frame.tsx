import type { ReactNode } from 'react';
import { ActionsToolbar, type ToolbarAction } from '@synapcity/frontend-blocks';
import { cn } from '@synapcity/frontend-ui/lib/utils';

import {
  ContextualPanelShell,
  type ContextualPanelDestination,
} from '../contextual-panel';

/**
 * One resource's view in the work area: a bounded surface holding an optional
 * header, the resource's body and its contextual panel with the rail. The
 * resource view owns the panel, so only views that offer destinations have
 * one; other pages (collections, Spaces) are unaffected.
 *
 * The look is the provisional workspace baseline (2026-10-27), accepted for
 * continued development, not a final visual direction.
 */
export function ResourceFrame({
  label,
  header,
  destinations = [],
  scroll = true,
  children,
}: {
  /** The resource's name, which labels the frame and its scrolling body. */
  label: string;
  /** Usually a `ResourceHeader`. Leave it out for a frame with no header. */
  header?: ReactNode;
  /** The contextual panel's destinations; without any, no panel or rail. */
  destinations?: readonly ContextualPanelDestination[];
  /**
   * Whether the frame scrolls the body (the default). Turn it off for content
   * that scrolls itself, such as a dashboard canvas.
   */
  scroll?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      data-fill-viewport
      data-slot="resource-frame"
      className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden p-2"
    >
      <section
        aria-label={label}
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm"
      >
        {header}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <ContextualPanelShell destinations={destinations}>
            {scroll ? (
              <div
                role="group"
                aria-label={`${label} contents`}
                tabIndex={0}
                data-slot="resource-body"
                className="scroll-fade-y min-h-0 min-w-0 flex-1 overflow-auto outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-ring"
              >
                {children}
              </div>
            ) : (
              <div
                data-slot="resource-body"
                className="flex min-h-0 min-w-0 flex-1 flex-col"
              >
                {children}
              </div>
            )}
          </ContextualPanelShell>
        </div>
      </section>
    </div>
  );
}

/**
 * The resource's own header: its icon and name (the page's heading, truncated
 * to one line) and its actions, which fold into "More actions" when the header
 * is narrow (`ActionsToolbar` measures its own width).
 */
export function ResourceHeader({
  title,
  icon,
  actions,
  children,
  className,
}: {
  title: string;
  /** Decorative: the title names the resource. */
  icon?: ReactNode;
  actions?: readonly ToolbarAction[];
  /** Controls shown at every width, after the actions. */
  children?: ReactNode;
  /** Layout classes only. */
  className?: string;
}) {
  const hasToolbar = (actions?.length ?? 0) > 0 || children !== undefined;
  return (
    <div
      data-slot="resource-header"
      className={cn(
        'flex h-12 shrink-0 items-center gap-2 border-b border-border px-4',
        className,
      )}
    >
      {icon && (
        <span
          aria-hidden="true"
          className="flex shrink-0 items-center text-muted-foreground"
        >
          {icon}
        </span>
      )}
      <h1 className="min-w-0 shrink truncate text-sm font-medium">{title}</h1>
      {hasToolbar && (
        <ActionsToolbar actions={actions} className="ml-auto flex-1">
          {children}
        </ActionsToolbar>
      )}
    </div>
  );
}
