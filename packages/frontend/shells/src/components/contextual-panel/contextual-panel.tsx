'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import type { GroupProps, PanelImperativeHandle } from 'react-resizable-panels';
import { PanelRightClose, type LucideIcon } from 'lucide-react';
import { Button } from '@synapcity/frontend-ui/core/button';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@synapcity/frontend-ui/core/resizable';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@synapcity/frontend-ui/core/tooltip';
import { cn } from '@synapcity/frontend-ui/lib/utils';

/** One place the panel can show. The panel knows only this list; each destination owns its content. */
export type ContextualPanelDestination = {
  /** Unique among the destinations. */
  id: string;
  /** The rail button's accessible name and tooltip, and the panel heading. */
  label: string;
  icon: LucideIcon;
  content: ReactNode;
};

type ContextualPanelControls = {
  /** The destination shown, or null before any has been opened. */
  activeId: string | null;
  expanded: boolean;
  /** Expands the panel on this destination. */
  open: (id: string) => void;
  collapse: () => void;
};

const ContextualPanelContext = createContext<ContextualPanelControls | null>(
  null,
);

/** The panel's controls, for content that opens a destination; null outside a panel. */
export function useContextualPanel(): ContextualPanelControls | null {
  return useContext(ContextualPanelContext);
}

/** Opening and closing glide for this long; a drag follows the pointer and never animates. */
const GLIDE_MS = 200;

/** Neither region may be dragged narrower than this. */
const REGION_MIN = '16rem';
const REGION_MIN_PX = 256;
/** The rail's width (`w-12`), which the container also has to hold. */
const RAIL_PX = 48;
/**
 * Below this container width the main region and the panel cannot both keep
 * their minimum, so an expanded panel takes the whole work area instead.
 */
const SIDE_BY_SIDE_PX = REGION_MIN_PX * 2 + RAIL_PX;
/** The resize handle's width (`w-1`). */
const HANDLE_PX = 4;
/** The width, in rem, a panel first opens at before anyone has resized it. */
const FIRST_OPEN_REM = 22;

/** Measures the shell's own width, so the layout follows its container, never the viewport. */
function useNarrow() {
  const ref = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? 0;
      // Zero means hidden or not laid out yet; that is not a narrow container.
      if (width > 0) setNarrow(width < SIDE_BY_SIDE_PX);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, narrow };
}

/**
 * The work area with a resizable panel on its right that collapses into an
 * icon rail. The rail lists the destinations; choosing one expands the panel on
 * it, and choosing the shown one again collapses it. Contents stay mounted once
 * visited, so switching destinations or collapsing keeps their state.
 *
 * Session-only state, as the global panel's: nothing is saved. In a container
 * too narrow for both regions, the expanded panel takes the whole work area.
 */
export function ContextualPanelShell({
  destinations,
  label = 'Contextual panel',
  children,
}: {
  destinations: readonly ContextualPanelDestination[];
  /** Names the rail and the panel region. @default 'Contextual panel' */
  label?: string;
  children: ReactNode;
}) {
  const id = useId();
  const panelId = `${id}-panel`;
  const mainId = `${id}-main`;
  const { ref: shellRef, narrow } = useNarrow();
  const panelRef = useRef<PanelImperativeHandle | null>(null);
  const regionRef = useRef<HTMLElement | null>(null);
  const railButtons = useRef(new Map<string, HTMLButtonElement>());
  /** The width the person last resized the panel to, in px; null until they do. */
  const chosenWidth = useRef<number | null>(null);
  const glideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [expanded, setExpanded] = useState(false);
  const [gliding, setGliding] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [visited, setVisited] = useState<ReadonlySet<string>>(new Set());
  const [focusIndex, setFocusIndex] = useState(0);
  const pendingFocusRegion = useRef(false);

  /** Room the two regions share: the shell less the rail and the handle. */
  const groupWidth = () =>
    (shellRef.current?.getBoundingClientRect().width ?? 0) -
    RAIL_PX -
    HANDLE_PX;

  /**
   * The size to open at: the whole area when narrow, otherwise the width the
   * person last chose (or the first-open width), never so wide that the main
   * region drops below its minimum. Asking for more is refused, not clamped.
   */
  const openSize = (): number | string => {
    if (narrow) return '100%';
    const rem = parseFloat(
      getComputedStyle(document.documentElement).fontSize || '16',
    );
    const wanted = chosenWidth.current ?? FIRST_OPEN_REM * rem;
    const room = groupWidth() - REGION_MIN_PX;
    return Math.max(REGION_MIN_PX, Math.min(wanted, room));
  };

  // A destination that is no longer offered stops being the active one.
  const active = destinations.find((d) => d.id === activeId) ?? null;

  const glide = useCallback(() => {
    clearTimeout(glideTimer.current);
    setGliding(true);
    glideTimer.current = setTimeout(() => setGliding(false), GLIDE_MS + 50);
  }, []);
  useEffect(() => () => clearTimeout(glideTimer.current), []);

  /** Before hiding focused panel contents, hand focus to the rail button that controls them. */
  const restoreFocus = useCallback(() => {
    if (!regionRef.current?.contains(document.activeElement)) return;
    const button = activeId ? railButtons.current.get(activeId) : undefined;
    button?.focus({ preventScroll: true });
  }, [activeId]);

  const collapse = useCallback(() => {
    restoreFocus();
    glide();
    panelRef.current?.collapse();
  }, [restoreFocus, glide]);

  const open = useCallback(
    (destinationId: string) => {
      setActiveId(destinationId);
      setVisited((seen) =>
        seen.has(destinationId) ? seen : new Set(seen).add(destinationId),
      );
      pendingFocusRegion.current = true;
      const panel = panelRef.current;
      if (panel?.isCollapsed()) {
        glide();
        panel.resize(openSize());
      }
    },
    // openSize reads only refs and `narrow`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [glide, narrow],
  );

  // Move focus into the panel once the destination it was opened on is showing.
  useEffect(() => {
    if (expanded && pendingFocusRegion.current) {
      pendingFocusRegion.current = false;
      regionRef.current?.focus({ preventScroll: true });
    }
  }, [expanded, activeId]);

  // Crossing the narrow line while expanded: take the whole area, or give the
  // main region back its room.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || panel.isCollapsed()) return;
    panel.resize(openSize());
    // Runs only when the container crosses the narrow line.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [narrow]);

  const choose = (destinationId: string) => {
    if (expanded && activeId === destinationId) collapse();
    else open(destinationId);
  };

  const rememberSize: NonNullable<GroupProps['onLayoutChanged']> = (
    layout,
    meta,
  ) => {
    // Only a completed resize by the person is a new preference; a drag shut
    // passes through smaller sizes, and a container resize is not a choice.
    const percent = layout[panelId];
    if (!meta.isUserInteraction || narrow || !percent) return;
    const width = (percent / 100) * groupWidth();
    if (width >= REGION_MIN_PX) chosenWidth.current = width;
  };

  // The rail is one tab stop; arrow keys move between its buttons.
  const onRailKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = destinations.length - 1;
    const next =
      event.key === 'ArrowDown'
        ? Math.min(focusIndex + 1, last)
        : event.key === 'ArrowUp'
          ? Math.max(focusIndex - 1, 0)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    setFocusIndex(next);
    const destination = destinations[next];
    if (destination) railButtons.current.get(destination.id)?.focus();
  };

  const controls = useMemo(
    () => ({ activeId: active?.id ?? null, expanded, open, collapse }),
    [active, expanded, open, collapse],
  );

  if (destinations.length === 0) return <>{children}</>;

  return (
    <ContextualPanelContext.Provider value={controls}>
      <div
        ref={shellRef}
        data-slot="contextual-panel-shell"
        data-contextual-panel={expanded ? 'open' : 'closed'}
        data-narrow={narrow ? '' : undefined}
        className="flex h-full min-h-0 min-w-0 flex-1"
      >
        <ResizablePanelGroup
          orientation="horizontal"
          onLayoutChanged={rememberSize}
          data-gliding={gliding ? '' : undefined}
          className="data-gliding:*:data-[slot=resizable-panel]:transition-[flex-grow] data-gliding:*:data-[slot=resizable-panel]:duration-200 data-gliding:*:data-[slot=resizable-panel]:ease-out"
        >
          <ResizablePanel
            id={mainId}
            defaultSize="100%"
            minSize={narrow ? 0 : REGION_MIN}
          >
            {/* The main region is a size container: what it holds responds to
                the room it is given here, not to the window. It does not
                scroll; each page owns its scroller, as in the work area. */}
            <div
              data-slot="contextual-main"
              inert={narrow && expanded}
              className="@container/main flex h-full min-h-0 min-w-0 flex-col overflow-hidden"
            >
              {children}
            </div>
          </ResizablePanel>
          <ResizableHandle
            data-contextual-panel-handle=""
            aria-label={`Resize ${label.toLowerCase()}`}
            disableDoubleClick
            // Nothing to resize while collapsed or taking the whole area; the
            // rail opens the panel, and its border already marks the edge. The
            // handle stays in the layout at zero width rather than display:none,
            // which loses the library's link to its panels and breaks keyboard
            // resizing once it shows again.
            disabled={narrow || !expanded}
            // A hairline, with a wider invisible strip either side to grab.
            className={cn(
              'after:absolute after:inset-y-0 after:left-1/2 after:w-2 after:-translate-x-1/2 aria-[orientation=vertical]:w-px',
              (narrow || !expanded) &&
                'pointer-events-none invisible aria-[orientation=vertical]:w-0',
            )}
          />
          <ResizablePanel
            id={panelId}
            panelRef={panelRef}
            defaultSize={0}
            collapsible
            collapsedSize={0}
            minSize={REGION_MIN}
            collapsedThreshold="8rem"
            groupResizeBehavior="preserve-pixel-size"
            onResize={(size) => {
              const nowExpanded = size.asPercentage > 0;
              if (!nowExpanded) restoreFocus();
              setExpanded(nowExpanded);
            }}
          >
            <section
              ref={regionRef}
              tabIndex={-1}
              data-contextual-panel-region=""
              aria-label={active ? `${label}: ${active.label}` : label}
              aria-hidden={!expanded}
              inert={!expanded}
              className="@container/panel flex h-full min-h-0 min-w-0 flex-col bg-background outline-none"
            >
              <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
                <h2 className="min-w-0 flex-1 truncate text-sm font-medium">
                  {active?.label ?? label}
                </h2>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Collapse ${label.toLowerCase()}`}
                        onClick={collapse}
                      />
                    }
                  >
                    <PanelRightClose />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Collapse</TooltipContent>
                </Tooltip>
              </div>
              {destinations.map((destination) =>
                visited.has(destination.id) ? (
                  <div
                    key={destination.id}
                    data-slot="contextual-panel-content"
                    role="group"
                    aria-label={`${destination.label} contents`}
                    // A scroller has to be reachable by keyboard to be scrolled.
                    tabIndex={0}
                    hidden={destination.id !== active?.id}
                    className="scroll-fade-y min-h-0 min-w-0 flex-1 overflow-auto outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-ring"
                  >
                    {destination.content}
                  </div>
                ) : null,
              )}
            </section>
          </ResizablePanel>
        </ResizablePanelGroup>
        <div
          role="toolbar"
          aria-label={label}
          aria-orientation="vertical"
          onKeyDown={onRailKeyDown}
          data-slot="contextual-panel-rail"
          className="flex w-12 shrink-0 flex-col items-center gap-1 border-l border-border bg-background py-2"
        >
          {destinations.map((destination, index) => {
            const Icon = destination.icon;
            const pressed = expanded && destination.id === active?.id;
            return (
              <Tooltip key={destination.id}>
                <TooltipTrigger
                  render={
                    <Button
                      ref={(element: HTMLButtonElement | null) => {
                        if (element)
                          railButtons.current.set(destination.id, element);
                        else railButtons.current.delete(destination.id);
                      }}
                      variant={pressed ? 'selected' : 'ghost'}
                      size="icon-lg"
                      aria-label={destination.label}
                      aria-pressed={pressed}
                      aria-controls={panelId}
                      tabIndex={index === focusIndex ? 0 : -1}
                      onFocus={() => setFocusIndex(index)}
                      onClick={() => choose(destination.id)}
                    />
                  }
                >
                  <Icon aria-hidden="true" />
                </TooltipTrigger>
                <TooltipContent side="left">{destination.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </ContextualPanelContext.Provider>
  );
}
