'use client';

import { gridLayoutFor } from '@synapcity/domain-dashboards';
import {
  GRID,
  columnsFor,
  layoutsEqual,
  minGridWidth,
  type LayoutItem,
} from '@synapcity/domain-grids';
import type { Ref } from 'react';
import ReactGridLayout, {
  useContainerWidth,
  type Layout,
} from 'react-grid-layout';

import { useDashboardStore, type DashboardStore } from '../../store';
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
      className={`react-resizable-handle react-resizable-handle-${axis} dashboard-resize-handle`}
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
  const applyLayoutChange = useDashboardStore((s) => s.applyLayoutChange);
  const { width, containerRef, mounted } = useContainerWidth({
    measureBeforeMount: true,
  });

  const cols = columnsFor(composition.settings.columns, breakpoint);
  const layout = gridLayoutFor(composition, breakpoint);
  const minWidth = minGridWidth(cols);

  if (layout.length === 0) return <DashboardEmptyState />;

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
          {layout.map((item) => (
            <div key={item.i} className="flex">
              <ConnectedWidget widgetId={item.i} />
            </div>
          ))}
        </ReactGridLayout>
      )}
    </div>
  );
}
