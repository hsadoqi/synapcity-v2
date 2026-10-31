'use client';

import {
  activeWidgets,
  widgetsWithStatus,
  type Widget,
} from '@synapcity/domain-dashboards';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@synapcity/frontend-ui/core/alert-dialog';
import { Button } from '@synapcity/frontend-ui/core/button';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { useId, type ReactNode } from 'react';

import { useDashboardConfig } from '../../config';
import { useDashboardStore } from '../../store';
import { WIDGET_CATALOG } from '../../utils/widget-catalog';

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <h3
        id={id}
        className="m-0 text-xs font-medium tracking-wide text-muted-foreground uppercase"
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

function WidgetRow({
  widget,
  children,
}: {
  widget: Widget;
  children: ReactNode;
}) {
  return (
    <li className="flex items-center justify-between gap-2 border-b border-divider py-2">
      <span className="truncate text-sm text-foreground">{widget.title}</span>
      <span className="flex shrink-0 gap-1">{children}</span>
    </li>
  );
}

/** Adds widgets from the palette, and shows or restores hidden and archived ones. */
export function WidgetsPanel() {
  const composition = useDashboardStore((s) => s.composition);
  const addWidget = useDashboardStore((s) => s.addWidget);
  const setWidgetStatus = useDashboardStore((s) => s.setWidgetStatus);
  const removeWidget = useDashboardStore((s) => s.removeWidget);
  const moveWidgetInOrder = useDashboardStore((s) => s.moveWidgetInOrder);
  const breakpoint = useDashboardStore((s) => s.breakpoint);
  const { widgetTypes, persistsStatus } = useDashboardConfig();
  const palette = widgetTypes
    ? WIDGET_CATALOG.filter(({ type }) => widgetTypes.includes(type))
    : WIDGET_CATALOG;
  const titles = new Map(
    activeWidgets(composition).map((w) => [w.id, w.title]),
  );
  // Reading order at the shown breakpoint: the order the arrange buttons move through.
  const order = [...composition.layouts[breakpoint]]
    .filter((item) => titles.has(item.i))
    .sort((a, b) => a.y - b.y || a.x - b.x);
  const hidden = widgetsWithStatus(composition, 'hidden');
  const archived = widgetsWithStatus(composition, 'archived');

  return (
    <div className="flex flex-col gap-6">
      <Section title="Add to dashboard">
        <div data-slot="widget-palette" className="grid grid-cols-2 gap-2.5">
          {palette.map(({ type, label, Icon }) => (
            <Button
              key={type}
              variant="outline"
              className="justify-start"
              onClick={() => addWidget(type)}
            >
              <Icon aria-hidden="true" />
              {label}
            </Button>
          ))}
        </div>
      </Section>

      {order.length > 1 && (
        <Section title="Arrange">
          <ol className="m-0 list-none p-0">
            {order.map((item, index) => {
              const title = titles.get(item.i) ?? '';
              return (
                <li
                  key={item.i}
                  className="flex items-center justify-between gap-2 border-b border-divider py-2"
                >
                  <span className="truncate text-sm text-foreground">
                    {title}
                  </span>
                  <span className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Move ${title} earlier`}
                      disabled={index === 0}
                      onClick={() => moveWidgetInOrder(item.i, -1)}
                    >
                      <ArrowUpIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Move ${title} later`}
                      disabled={index === order.length - 1}
                      onClick={() => moveWidgetInOrder(item.i, 1)}
                    >
                      <ArrowDownIcon />
                    </Button>
                  </span>
                </li>
              );
            })}
          </ol>
        </Section>
      )}

      {persistsStatus && (
        <>
          <Section title={`Hidden (${hidden.length})`}>
            {hidden.length === 0 ? (
              <p className="m-0 text-sm text-muted-foreground">
                Nothing hidden.
              </p>
            ) : (
              <ul className="m-0 list-none p-0">
                {hidden.map((widget) => (
                  <WidgetRow key={widget.id} widget={widget}>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Show ${widget.title}`}
                      onClick={() => setWidgetStatus(widget.id, 'active')}
                    >
                      Show
                    </Button>
                  </WidgetRow>
                ))}
              </ul>
            )}
          </Section>

          <Section title={`Archived (${archived.length})`}>
            {archived.length === 0 ? (
              <p className="m-0 text-sm text-muted-foreground">
                Nothing archived.
              </p>
            ) : (
              <ul className="m-0 list-none p-0">
                {archived.map((widget) => (
                  <WidgetRow key={widget.id} widget={widget}>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Restore ${widget.title}`}
                      onClick={() => setWidgetStatus(widget.id, 'active')}
                    >
                      Restore
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            variant="destructive"
                            size="sm"
                            aria-label={`Delete ${widget.title}`}
                          />
                        }
                      >
                        Delete
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete “{widget.title}”?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            The widget and its layout are removed from this
                            dashboard. The data it showed is kept.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removeWidget(widget.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </WidgetRow>
                ))}
              </ul>
            )}
          </Section>
        </>
      )}
    </div>
  );
}
