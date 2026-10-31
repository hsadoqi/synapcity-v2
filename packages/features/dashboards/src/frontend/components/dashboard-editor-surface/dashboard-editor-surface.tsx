'use client';

import { resolveBreakpoint } from '@synapcity/domain-grids';
import { Button } from '@synapcity/frontend-ui/core/button';
import { PencilRulerIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, type ReactNode } from 'react';

import { PaletteOpenerProvider } from '../../config';
import { useElementWidth } from '../../hooks/use-element-width';
import { useDashboardStore } from '../../store';
import { focusPalette } from '../../utils/focus';
import { BreakpointToolbar } from '../breakpoint-toolbar';
import { DashboardCanvas } from '../dashboard-canvas';
import { LiveAnnouncer } from '../live-announcer';
import { SaveStatusIndicator } from '../save-status';
import { UndoRemove } from '../undo-remove';
import { useFocusAfterWidgetChanges } from './use-focus-after-widget-changes';

/**
 * The editable canvas: save status, Undo, Edit layout, the breakpoint
 * preview and the canvas. It reads the nearest dashboard store and owns no
 * state of its own; editing, layout and save state all live in the store.
 *
 * The widgets palette is not part of it. A host shows `DashboardWidgetsDestination`
 * wherever it likes (a panel destination, or `beside` for an inline column) and
 * passes `onOpenPalette` to be told when the palette is wanted: Edit layout
 * turning editing on, Add a widget in the empty state, or the last widget
 * removed. The host decides what showing it means; the surface then hands
 * focus to the palette's first button, waiting a bounded time for it to open.
 * Turning editing off, or closing or changing the host's destination, never
 * comes back through this callback.
 */
export function DashboardEditorSurface({
  onOpenPalette,
  announce = true,
  beside,
}: {
  /** Called when the palette is wanted; the host shows it. */
  onOpenPalette?: () => void;
  /**
   * Render the polite live region for announcements. Turn off when the host
   * renders `LiveAnnouncer` outside any region it may make inert.
   * @default true
   */
  announce?: boolean;
  /** Content beside the canvas, such as an inline palette column. */
  beside?: ReactNode;
}) {
  const editMode = useDashboardStore((s) => s.editMode);
  const toggleEditMode = useDashboardStore((s) => s.toggleEditMode);
  const setBreakpoint = useDashboardStore((s) => s.setBreakpoint);
  const [ref, width] = useElementWidth<HTMLDivElement>();
  useEffect(() => {
    if (width) setBreakpoint(resolveBreakpoint(width));
  }, [width, setBreakpoint]);

  const hostOpen = useRef(onOpenPalette);
  useEffect(() => {
    hostOpen.current = onOpenPalette;
  });
  const cancelFocus = useRef<(() => void) | undefined>(undefined);
  const openPalette = useCallback(() => {
    hostOpen.current?.();
    cancelFocus.current?.();
    cancelFocus.current = focusPalette();
  }, []);
  // A pending handoff is only wanted while editing, and not after unmount.
  useEffect(() => {
    if (!editMode) cancelFocus.current?.();
  }, [editMode]);
  useEffect(() => () => cancelFocus.current?.(), []);

  useFocusAfterWidgetChanges(openPalette);

  return (
    <PaletteOpenerProvider value={openPalette}>
      <div ref={ref} className="flex min-h-0 min-w-0 flex-1 flex-col">
        {announce && <LiveAnnouncer />}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-5 py-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <SaveStatusIndicator />
            <UndoRemove />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={editMode ? 'selected' : 'outline'}
              aria-pressed={editMode}
              onClick={() => {
                const entering = !editMode;
                toggleEditMode();
                // Without a host to show the palette there is nothing to hand focus to.
                if (entering && onOpenPalette) openPalette();
              }}
            >
              <PencilRulerIcon aria-hidden="true" />
              Edit layout
            </Button>
            <BreakpointToolbar />
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <DashboardCanvas />
          {beside}
        </div>
      </div>
    </PaletteOpenerProvider>
  );
}
