'use client';

import { gridLayoutFor } from '@synapcity/domain-dashboards';
import {
  GRID,
  columnsFor,
  layoutsEqual,
  minGridWidth,
  type LayoutItem,
} from '@synapcity/domain-grids';
import { useMemo, type KeyboardEvent, type Ref } from 'react';
import ReactGridLayout, {
  useContainerWidth,
  type Layout,
} from 'react-grid-layout';

import { cn } from '@synapcity/frontend-ui/lib/utils';

import { useDashboardStore, type DashboardStore } from '../../store';
import { keyboardDelta } from '../../store/keyboard-move';
import { ConnectedWidget } from '../connected-widget';
import { DashboardEmptyState } from '../dashboard-empty-state';

/** Interactive children must not start a drag. */
const DRAG_CANCEL =
  "button, input, textarea, select, a, label, [role='checkbox'], [data-no-drag]";

/**
 * Folds a layout the grid reported into the shown breakpoint. The grid echoes
 * the layout it was given on mount and on prop changes; that is not a change.
 */
export function handleLayoutChange(
  state: Pick<DashboardStore, 'breakpoint' | 'applyLayoutChange'>,
  given: readonly LayoutItem[],
  reported: readonly LayoutItem[],
) {
  const items = reported.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }));
  if (layoutsEqual(items, given)) return;
  state.applyLayoutChange(state.breakpoint, items);
}

/**
 * Must return the DOM element itself: react-draggable clones it to attach its
 * pointer handlers, which a wrapper component would swallow.
 */
function renderResizeHandle(axis: string, ref: Ref<HTMLElement>) {
  return (
    <span
      ref={ref as Ref<HTMLSpanElement>}
      aria-hidden="true"
      className={cn(
        'react-resizable-handle dashboard-resize-handle',
        `react-resizable-handle-${axis}`,
      )}
    >
      <svg
        viewBox="0 0 256 256"
        fill="none"
        stroke="currentColor"
        strokeWidth="18"
        strokeLinecap="round"
        className="size-4"
      >
        <line x1="200" y1="96" x2="96" y2="200" />
        <line x1="216" y1="152" x2="152" y2="216" />
      </svg>
    </span>
  );
}

/**
 * The grid at the shown breakpoint. Layout is controlled: the saved layout
 * goes in, and every change the grid reports is stored for that breakpoint only.
 */
export function DashboardGrid() {
  const composition = useDashboardStore((s) => s.composition);
  const breakpoint = useDashboardStore((s) => s.breakpoint);
  const editMode = useDashboardStore((s) => s.editMode);
  const selectedWidgetId = useDashboardStore((s) => s.selectedWidgetId);
  const selectWidget = useDashboardStore((s) => s.selectWidget);
  const nudgeWidget = useDashboardStore((s) => s.nudgeWidget);
  const applyLayoutChange = useDashboardStore((s) => s.applyLayoutChange);
  const { width, containerRef, mounted } = useContainerWidth({
    measureBeforeMount: true,
  });

  const cols = columnsFor(composition.settings.columns, breakpoint);
  // react-grid-layout relies on stable layout identity between unrelated renders.
  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- The compiler cannot prove this third-party identity requirement.
  const layout = useMemo(
    () => gridLayoutFor(composition, breakpoint),
    [composition, breakpoint],
  );
  const minWidth = minGridWidth(cols);

  if (layout.length === 0) return <DashboardEmptyState />;

  /**
   * Keyboard select and move, edit mode only. Acts only when the wrapper
   * itself has focus, so keys typed in a widget's inputs are left alone.
   */
  const handleWidgetKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    id: string,
  ) => {
    if (!editMode || event.target !== event.currentTarget) return;
    if (event.key === ' ') {
      event.preventDefault();
      if (event.repeat) return;
      selectWidget(selectedWidgetId === id ? null : id);
      return;
    }
    if (event.key === 'Escape' && selectedWidgetId === id) {
      event.preventDefault();
      selectWidget(null);
      return;
    }
    if (selectedWidgetId !== id) return;
    const delta = keyboardDelta(event.key, event.shiftKey);
    if (!delta) return;
    event.preventDefault();
    nudgeWidget(id, delta);
  };

  return (
    <div ref={containerRef} className="w-full">
      {mounted && (
        <ReactGridLayout
          className="dashboard-grid"
          width={Math.max(width, minWidth)}
          layout={layout}
          gridConfig={{
            cols,
            rowHeight: GRID.rowHeight,
            margin: [GRID.margin, GRID.margin],
            containerPadding: [0, 0],
          }}
          dragConfig={{ enabled: editMode, cancel: DRAG_CANCEL, threshold: 3 }}
          resizeConfig={{
            enabled: editMode,
            handles: ['se'],
            handleComponent: renderResizeHandle,
          }}
          onLayoutChange={(next: Layout) =>
            handleLayoutChange({ breakpoint, applyLayoutChange }, layout, next)
          }
        >
          {layout.map((item) => {
            const title = composition.widgets.find(
              (w) => w.id === item.i,
            )?.title;
            const selected = editMode && selectedWidgetId === item.i;
            return (
              <div
                key={item.i}
                role="group"
                tabIndex={editMode ? 0 : undefined}
                aria-label={
                  title ? `${title}${selected ? ', selected' : ''}` : undefined
                }
                aria-keyshortcuts={
                  editMode
                    ? 'Space Escape ArrowLeft ArrowRight ArrowUp ArrowDown Shift+ArrowLeft Shift+ArrowRight Shift+ArrowUp Shift+ArrowDown'
                    : undefined
                }
                onKeyDown={(event) => handleWidgetKeyDown(event, item.i)}
                className={cn(
                  'flex rounded-xl',
                  selected && 'outline-2 outline-offset-2 outline-ring',
                )}
              >
                <ConnectedWidget widgetId={item.i} />
              </div>
            );
          })}
        </ReactGridLayout>
      )}
    </div>
  );
}
