'use client';

import { cn } from '@synapcity/frontend-ui/lib/utils';

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

  return (
    <div
      ref={ref}
      className="scroll-fade-y flex min-w-0 flex-1 flex-col overflow-auto bg-muted px-5 pt-7 pb-16"
    >
      <div
        className="mx-auto flex w-full flex-col gap-2"
        // The frame's width is the one dynamic value: the device's width.
        style={{ maxWidth: framed ? frameWidth : undefined }}
      >
        {framed && (
          <p className="m-0 text-xs text-muted-foreground tabular-nums">
            {FRAME_LABEL[breakpoint]} · {frameWidth}px
          </p>
        )}
        <div
          className={cn(
            'w-full',
            framed &&
              'rounded-xl border border-border bg-background px-5 pt-7 pb-10',
          )}
        >
          <DashboardGrid key={breakpoint} />
        </div>
      </div>
    </div>
  );
}
