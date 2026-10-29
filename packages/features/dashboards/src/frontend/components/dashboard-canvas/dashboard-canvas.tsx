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
 * The device frame presents a preview the person chose; it never follows the
 * width. It is drawn only when the breakpoint is locked (`chooseBreakpoint`),
 * that breakpoint has a device width (tablet, mobile), and the canvas has room
 * for the frame. The grid then lays out exactly as it would on that device.
 * Otherwise the canvas is the device: an unlocked layout fills the canvas at
 * whatever width it resolved from, and a locked preview without room drops the
 * frame but keeps the lock. Without `deviceFrame`, no frame is ever drawn.
 */
export function DashboardCanvas({
  deviceFrame = true,
}: {
  /** Preview narrower breakpoints in a device frame. @default true */
  deviceFrame?: boolean;
}) {
  const breakpoint = useDashboardStore((s) => s.breakpoint);
  const breakpointLocked = useDashboardStore((s) => s.breakpointLocked);
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const frameWidth = DEVICE_FRAME_WIDTH[breakpoint];
  const framed =
    deviceFrame &&
    breakpointLocked &&
    frameWidth !== null &&
    width !== null &&
    width > frameWidth + FRAME_CHROME;

  return (
    <div
      ref={ref}
      data-slot="dashboard-canvas"
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
