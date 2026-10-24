'use client';

import { useElementWidth } from '../../hooks/use-element-width';
import { useDashboardStore } from '../../store';
import { DEVICE_FRAME_WIDTH } from '../../utils/device-frame';
import { DashboardGrid } from '../dashboard-grid';

const FRAME_LABEL = { lg: 'Desktop', md: 'Tablet', sm: 'Mobile' } as const;

/** Room the frame's own border and padding need around the device width. */
const FRAME_CHROME = 80;

/**
 * Desktop fills the canvas; tablet and mobile render inside a frame at the
 * device width, so the grid lays out exactly as it would there. On a screen
 * already that narrow, the frame is dropped: the canvas is the device.
 */
export function DashboardCanvas() {
  const breakpoint = useDashboardStore((s) => s.breakpoint);
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const frameWidth = DEVICE_FRAME_WIDTH[breakpoint];
  const framed =
    frameWidth !== null && width !== null && width > frameWidth + FRAME_CHROME;
  const grid = <DashboardGrid key={breakpoint} />;

  return (
    <div
      ref={ref}
      className="flex min-w-0 flex-1 flex-col overflow-auto bg-muted px-5 pt-7 pb-16"
    >
      {framed ? (
        // The frame's width is the one dynamic value: the device's width.
        <div
          className="mx-auto flex w-full flex-col gap-2"
          style={{ maxWidth: frameWidth }}
        >
          <p className="m-0 font-mono text-xs text-muted-foreground tabular-nums">
            {FRAME_LABEL[breakpoint]} · {frameWidth}px
          </p>
          <div className="rounded-xl border border-border bg-background px-5 pt-7 pb-10">
            {grid}
          </div>
        </div>
      ) : (
        grid
      )}
    </div>
  );
}
