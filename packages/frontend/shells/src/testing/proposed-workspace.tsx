import { Fragment } from 'react';
import { MoreHorizontal } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@synapcity/frontend-ui/core/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@synapcity/frontend-ui/core/dropdown-menu';
import { Button } from '@synapcity/frontend-ui/core/button';
import { cn } from '@synapcity/frontend-ui/lib/utils';

import {
  ContextualPanelShell,
  type ContextualPanelDestination,
} from '../components/contextual-panel';
import type { RootBreadcrumb } from '../components/header-breadcrumbs';

/**
 * Story content only, for visual review: a PROPOSED workspace, not a built
 * component. It sits inside the existing global shell's work area, below the
 * global header and its global panel, and holds its own header, the main
 * content, and the (real) contextual panel with its rail in one bounded frame.
 *
 * The global header identifies Synapcity and owns global controls; this
 * workspace header identifies the working context (its breadcrumbs) and owns
 * the workspace's own actions. It has no global panel control.
 */

function Label({ children }: { children: string }) {
  return (
    <span className="w-fit shrink-0 rounded-sm bg-muted px-1.5 py-0.5 text-2xs font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </span>
  );
}

const LINES = ['w-full', 'w-11/12', 'w-full', 'w-4/5', 'w-full', 'w-2/3'];

function DocumentBody() {
  return (
    <div
      role="group"
      aria-label="Document contents"
      tabIndex={0}
      className="scroll-fade-y min-h-0 flex-1 overflow-y-auto outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-ring"
    >
      <div className="mx-auto flex w-full max-w-prose flex-col gap-6 px-4 py-6 @3xl/main:px-8 @3xl/main:py-10">
        <Label>Placeholder document body</Label>
        {Array.from({ length: 8 }, (_, block) => (
          <div key={block} className="flex flex-col gap-2">
            {LINES.map((width, line) => (
              <div
                key={line}
                className={cn('h-2.5 rounded-sm bg-muted', width)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardBody() {
  return (
    <div
      role="group"
      aria-label="Dashboard contents"
      tabIndex={0}
      className="scroll-fade-y min-h-0 flex-1 overflow-y-auto bg-muted/40 outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-ring"
    >
      <div className="flex flex-col gap-4 p-4 @3xl/main:p-6">
        <Label>Placeholder dashboard canvas</Label>
        <div className="grid grid-cols-1 gap-4 @md/main:grid-cols-2 @5xl/main:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="h-36 rounded-md border border-dashed border-border bg-background"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * The working context as breadcrumbs, collapsing with the workspace header's
 * own width: wide, every level shows; narrower, the earlier levels fold into a
 * menu behind an ellipsis; narrowest, only the current item shows, truncated.
 */
function WorkspaceBreadcrumbs({ items }: { items: RootBreadcrumb[] }) {
  const last = items.length - 1;
  const earlier = items.slice(0, Math.max(0, last - 1));
  return (
    <Breadcrumb aria-label="Workspace location" className="min-w-0 flex-1">
      <BreadcrumbList className="flex-nowrap text-sm">
        {items.map((item, index) => {
          const isLast = index === last;
          const isParent = index === last - 1;
          // Earlier levels need the most room; the parent a little; the
          // current item always shows.
          const PARENT = 'hidden @sm/workspace-header:inline-flex';
          const visibility = isLast
            ? undefined
            : isParent
              ? PARENT
              : 'hidden @2xl/workspace-header:inline-flex';
          // The separator before the current item shows only with its parent.
          const separator = isLast ? PARENT : visibility;
          return (
            <Fragment key={`${item.href ?? ''}${item.label}`}>
              {index > 0 && <BreadcrumbSeparator className={separator} />}
              <BreadcrumbItem className={cn('min-w-0', visibility)}>
                {isLast || !item.href ? (
                  <BreadcrumbPage className="truncate font-medium">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink className="truncate" href={item.href}>
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {/* Where the earlier levels fold away, a menu still reaches them. */}
              {index === 0 && earlier.length > 0 && (
                <BreadcrumbItem className="hidden @sm/workspace-header:inline-flex @2xl/workspace-header:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Show earlier locations"
                        />
                      }
                    >
                      <MoreHorizontal aria-hidden="true" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {earlier.map((crumb) => (
                        <DropdownMenuItem
                          key={crumb.label}
                          render={<a href={crumb.href} />}
                        >
                          {crumb.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </BreadcrumbItem>
              )}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** The proposed workspace header: the working context and the workspace's own actions. */
function ProposedWorkspaceHeader({ trail }: { trail: RootBreadcrumb[] }) {
  return (
    <div className="@container/workspace-header shrink-0 border-b border-border">
      <div className="flex h-12 items-center gap-3 px-4">
        <WorkspaceBreadcrumbs items={trail} />
        <span className="hidden @lg/workspace-header:inline-flex">
          <Label>Proposed workspace header</Label>
        </span>
        <div className="flex shrink-0 gap-1" aria-hidden="true">
          {[0, 1].map((index) => (
            <span
              key={index}
              className="size-7 rounded-md border border-dashed border-border"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * The bounded workspace: one framed surface filling the global shell's work
 * area. Its header spans the main content, the contextual panel and the rail.
 */
export function ProposedWorkspace({
  kind,
  trail,
  destinations,
}: {
  kind: 'document' | 'dashboard';
  trail: RootBreadcrumb[];
  destinations: readonly ContextualPanelDestination[];
}) {
  return (
    <div
      data-fill-viewport
      className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden p-2"
    >
      <section
        aria-label="Workspace"
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm"
      >
        <ProposedWorkspaceHeader trail={trail} />
        <div className="flex min-h-0 flex-1">
          <ContextualPanelShell destinations={destinations}>
            {kind === 'document' ? <DocumentBody /> : <DashboardBody />}
          </ContextualPanelShell>
        </div>
      </section>
    </div>
  );
}
