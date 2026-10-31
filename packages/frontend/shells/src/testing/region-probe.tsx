'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Columns per region, from that region's own container. Written out in full so
 * Tailwind finds every class; a region never reads the window's width.
 */
const GRID = {
  main: 'grid grid-cols-1 gap-3 @md/main:grid-cols-2 @3xl/main:grid-cols-3',
  panel: 'grid grid-cols-1 gap-3 @md/panel:grid-cols-2 @3xl/panel:grid-cols-3',
} as const;

const LABEL = { main: 'Main region', panel: 'Panel' } as const;

/**
 * Story content only: fills a region of the contextual panel shell, prints
 * its measured width and lays out its cards with that region's container
 * queries, so a reviewer can watch it grow and shrink with the room it gets.
 */
export function RegionProbe({ region }: { region: keyof typeof GRID }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.round(entry?.contentRect.width ?? 0)),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      data-testid={`${region}-probe`}
      className={
        region === 'main'
          ? 'scroll-fade-y flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4'
          : 'flex flex-col gap-4 p-4'
      }
    >
      <p className="text-xs text-muted-foreground tabular-nums">
        {LABEL[region]}: {width ?? '…'}px
      </p>
      <div data-testid={`${region}-grid`} className={GRID[region]}>
        {Array.from({ length: 9 }, (_, index) => (
          <div
            key={index}
            className="h-24 rounded-md border border-border bg-muted"
          />
        ))}
      </div>
      {region === 'main' && (
        <button className="self-start text-sm underline">Page action</button>
      )}
    </div>
  );
}
