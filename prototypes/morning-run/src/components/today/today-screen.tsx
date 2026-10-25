'use client';

import { RotateCcw } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Responsive, useContainerWidth, type Layout } from 'react-grid-layout';

import { PageFrame } from '@/components/shared/site-nav';
import { IntentionCard } from '@/components/shared/intention-card';
import { Button, ButtonLink } from '@/components/ui/button';
import { useHydrated } from '@/hooks/use-hydrated';
import {
  flowLayout,
  mergeLayout,
  nudge,
  sizeOf,
  stackLayout,
  type LayoutItem,
} from '@/lib/board/layout';
import { WIDGET_ORDER, toggleBoardItem } from '@/lib/board/model';
import { dateKey } from '@/lib/history/stats';
import { DESTINATION_META, type DestinationId } from '@/lib/runs/destinations';
import { useStore } from '@/lib/storage/persisted-store';
import { boardStore, layoutStore } from '@/lib/storage/stores';
import {
  FocusWidget,
  ItemsWidget,
  JournalWidget,
  WidgetFrame,
} from './widgets';

function BoardGrid({
  ids,
  layout,
  onSave,
  renderWidget,
}: {
  ids: string[];
  layout: LayoutItem[];
  onSave: (layout: LayoutItem[]) => void;
  renderWidget: (id: string) => ReactNode;
}) {
  const { width, containerRef, mounted } = useContainerWidth();
  const [breakpoint, setBreakpoint] = useState('lg');
  const layouts = useMemo(
    () => ({ lg: layout, xxs: stackLayout(layout) }),
    [layout],
  );
  return (
    <div ref={containerRef} className="-mx-1">
      {mounted ? (
        <Responsive
          width={width}
          breakpoints={BREAKPOINTS}
          cols={COLS}
          layouts={layouts as unknown as Record<string, Layout>}
          rowHeight={40}
          margin={[16, 16]}
          dragConfig={{ handle: '.widget-handle' }}
          onBreakpointChange={(bp) => setBreakpoint(bp)}
          onLayoutChange={(current) => {
            if (breakpoint !== 'lg') return;
            const next = current.map((item): LayoutItem => ({
              i: item.i,
              x: item.x,
              y: item.y,
              w: item.w,
              h: item.h,
            }));
            const same =
              next.length === layout.length &&
              next.every((n) => {
                const o = layout.find((l) => l.i === n.i);
                return (
                  o && o.x === n.x && o.y === n.y && o.w === n.w && o.h === n.h
                );
              });
            if (!same) onSave(next);
          }}
        >
          {ids.map((id) => (
            <div key={id} data-grid-size={`${sizeOf(id).w}x${sizeOf(id).h}`}>
              {renderWidget(id)}
            </div>
          ))}
        </Responsive>
      ) : null}
    </div>
  );
}

const BREAKPOINTS = { lg: 900, xxs: 0 };
const COLS = { lg: 12, xxs: 1 };

export function TodayScreen() {
  const hydrated = useHydrated();
  const [board, setBoard] = useStore(boardStore);
  const [saved, setSaved] = useStore(layoutStore);

  const today = hydrated ? dateKey(new Date()) : '';
  const fresh = hydrated && board.date === today;

  const ids = useMemo(() => {
    if (!fresh) return [];
    const withItems = WIDGET_ORDER.filter((dest) =>
      dest === 'Focus'
        ? Boolean(board.focus) || (board.items.Focus?.length ?? 0) > 0
        : (board.items[dest]?.length ?? 0) > 0,
    );
    return ['Journal', ...withItems];
  }, [board, fresh]);

  const layout = useMemo(() => mergeLayout(saved, ids), [saved, ids]);
  if (!hydrated) {
    return (
      <PageFrame width="max-w-[1100px]">
        <p role="status" className="text-muted-foreground">
          Loading...
        </p>
      </PageFrame>
    );
  }

  if (!fresh) {
    return (
      <PageFrame width="max-w-[1100px]">
        <h1 className="text-4xl font-light sm:text-5xl">Today</h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Nothing is set up for today yet. Do a run and its answers land here:
          tasks, a schedule, a focus session and a private journal you can
          arrange however you like.
        </p>
        <ButtonLink href="/" size="xl" className="self-start">
          Pick a run
        </ButtonLink>
      </PageFrame>
    );
  }

  const apply = (
    id: string,
    key: Parameters<typeof nudge>[2],
    resize: boolean,
  ) => setSaved(nudge(layout, id, key, resize));

  const widget = (id: string) => {
    if (id === 'Journal') {
      return (
        <WidgetFrame
          key={id}
          id={id}
          title="Journal"
          icon="Journal"
          onNudge={(k, r) => apply(id, k, r)}
        >
          <JournalWidget
            initial={board.journal}
            onChange={(journal) => setBoard((b) => ({ ...b, journal }))}
          />
        </WidgetFrame>
      );
    }
    const dest = id as DestinationId;
    const items = board.items[dest] ?? [];
    const done = items.filter((i) => i.done).length;
    return (
      <WidgetFrame
        key={id}
        id={id}
        title={dest}
        icon={dest}
        meta={
          items.length > 0 && DESTINATION_META[dest].checkable
            ? `${done}/${items.length}`
            : undefined
        }
        onNudge={(k, r) => apply(id, k, r)}
      >
        {dest === 'Focus' ? (
          <FocusWidget plan={board.focus ?? null} />
        ) : (
          <ItemsWidget
            dest={dest}
            items={items}
            onToggle={(d, itemId) =>
              setBoard((b) => toggleBoardItem(b, d, itemId))
            }
          />
        )}
      </WidgetFrame>
    );
  };

  return (
    <PageFrame width="max-w-[1100px]">
      <header className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[0.8125rem] text-primary">TODAY</p>
          <h1 className="text-4xl leading-none font-light tracking-tight sm:text-5xl">
            {board.intention?.dateLabel ?? 'Today'}
          </h1>
        </div>
        <Button
          variant="ghost"
          size="touch"
          className="ml-auto text-muted-foreground"
          onClick={() => setSaved(flowLayout(ids))}
        >
          <RotateCcw data-icon="inline-start" />
          Reset layout
        </Button>
      </header>

      {board.intention ? <IntentionCard intention={board.intention} /> : null}

      <p className="text-sm text-muted-foreground">
        Drag a widget by its header, or focus its grip and use the arrow keys to
        move it and Shift and arrows to resize it.
      </p>

      <BoardGrid
        ids={ids}
        layout={layout}
        onSave={setSaved}
        renderWidget={widget}
      />
    </PageFrame>
  );
}
