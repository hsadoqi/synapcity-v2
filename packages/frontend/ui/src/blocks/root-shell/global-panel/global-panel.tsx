'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { GroupProps, PanelImperativeHandle } from 'react-resizable-panels';
import {
  ChevronDown,
  ChevronUp,
  Lock,
  LockOpen,
  PanelTop,
  X,
} from 'lucide-react';
import { Button } from '@synapcity/frontend-ui/core/button';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@synapcity/frontend-ui/core/resizable';

const OVERLAYS =
  '[role="menu"], [role="dialog"], [role="alertdialog"], [role="listbox"], [data-slot="popover-content"]';
const OVERLAY_BACKDROPS =
  '[data-slot="dialog-overlay"], [data-slot="alert-dialog-overlay"], [data-slot="sheet-overlay"], [data-slot="dialog-backdrop"], [data-slot="alert-dialog-backdrop"], [data-slot="sheet-backdrop"]';

type PanelControls = {
  id: string;
  open: boolean;
  toggle: () => void;
  setTrigger: (element: HTMLButtonElement | null) => void;
};

const PanelContext = createContext<PanelControls | null>(null);

/** Header action is absent outside a panel-enabled shell (including public pages). */
export function GlobalPanelToggle() {
  const panel = useContext(PanelContext);
  if (!panel) return null;
  const { id, open, toggle, setTrigger } = panel;
  return (
    <Button
      ref={setTrigger}
      variant="ghost"
      size="icon-lg"
      aria-label="Toggle global panel"
      title="Global panel"
      aria-expanded={open}
      aria-controls={id}
      data-global-panel-toggle=""
      onClick={toggle}
    >
      <PanelTop />
    </Button>
  );
}

/** Mounted-session shell state only; content and any future persistence belong to the caller. */
export function GlobalPanelShell({
  header,
  panel,
  children,
}: {
  header: ReactNode;
  panel?: ReactNode;
  children: ReactNode;
}) {
  const id = useId();
  const panelId = `${id}-global-panel`;
  const headerId = `${id}-app-header`;
  const handleRef = useRef<PanelImperativeHandle | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const headerToggleRef = useRef<HTMLButtonElement | null>(null);
  const lockRef = useRef<HTMLButtonElement | null>(null);
  const pendingTriggerFocus = useRef(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const regionRef = useRef<HTMLElement | null>(null);
  const lastOpenSize = useRef<number | string>('30%');
  const [open, setOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  const [headerRevealed, setHeaderRevealed] = useState(false);
  const headerHidden = header != null && open && locked && !headerRevealed;
  const setTrigger = useCallback((element: HTMLButtonElement | null) => {
    triggerRef.current = element;
  }, []);

  const restoreFocus = useCallback(() => {
    if (regionRef.current?.contains(document.activeElement)) {
      if (headerRef.current?.hidden) {
        pendingTriggerFocus.current = true;
      } else {
        triggerRef.current?.focus({ preventScroll: true });
      }
    }
  }, []);

  useEffect(() => {
    // A locked panel's trigger is inside the hidden app header. Restore it
    // only after the closing render has made that header available again.
    if (!headerHidden && pendingTriggerFocus.current) {
      pendingTriggerFocus.current = false;
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, [headerHidden, open]);

  const toggleLock = () => {
    if (!locked && headerRef.current?.contains(document.activeElement)) {
      lockRef.current?.focus({ preventScroll: true });
    }
    setHeaderRevealed(false);
    setLocked((value) => !value);
  };

  const toggleHeader = () => {
    if (headerRevealed && headerRef.current?.contains(document.activeElement)) {
      headerToggleRef.current?.focus({ preventScroll: true });
    }
    setHeaderRevealed((value) => !value);
  };

  const close = useCallback(() => {
    restoreFocus();
    handleRef.current?.collapse();
  }, [restoreFocus]);

  const toggle = () => {
    const handle = handleRef.current;
    if (!handle) return;
    if (handle.isCollapsed()) handle.resize(lastOpenSize.current);
    else close();
  };

  const rememberSize: NonNullable<GroupProps['onLayoutChanged']> = (
    layout,
    meta,
  ) => {
    // Only a completed user resize is a new preference. A drag shut passes
    // through intermediate sizes, and a viewport resize is not a preference.
    const percent = layout[panelId];
    if (!meta.isUserInteraction || percent === undefined || percent < 15)
      return;
    const size = handleRef.current?.getSize();
    lastOpenSize.current =
      size && size.inPixels > 0 ? size.inPixels : `${percent}%`;
  };

  useEffect(() => {
    if (!open || locked) return;
    const outside = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || event.button !== 0) return;
      if (
        regionRef.current?.contains(target) ||
        triggerRef.current?.contains(target) ||
        target.closest(
          `[data-global-panel-handle], ${OVERLAYS}, ${OVERLAY_BACKDROPS}`,
        )
      )
        return;
      close();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing)
        return;
      // Capture observes open layers before their own handlers remove them.
      // Menus/dialogs consume the first Escape; the panel gets the next one.
      const overlayOpen = [
        ...document.querySelectorAll<HTMLElement>(OVERLAYS),
      ].some(
        (element) =>
          !element.closest(
            '[inert], [hidden], [aria-hidden="true"], [data-state="closed"], [data-closed], [data-ending-style]',
          ) &&
          getComputedStyle(element).display !== 'none' &&
          getComputedStyle(element).visibility !== 'hidden',
      );
      if (overlayOpen) return;
      event.preventDefault();
      close();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape, true);
    };
  }, [open, locked, close]);

  return (
    <PanelContext.Provider value={{ id: panelId, open, toggle, setTrigger }}>
      <div
        id={headerId}
        ref={headerRef}
        data-slot="shell-app-header"
        hidden={headerHidden}
        inert={headerHidden}
        className="shrink-0"
      >
        {header}
      </div>
      <ResizablePanelGroup
        orientation="vertical"
        onLayoutChanged={rememberSize}
      >
        <ResizablePanel
          id={panelId}
          panelRef={handleRef}
          defaultSize={0}
          collapsible
          collapsedSize={0}
          minSize="4rem"
          collapsedThreshold="2rem"
          groupResizeBehavior="preserve-pixel-size"
          onResize={(size) => {
            const expanded = size.asPercentage > 0;
            if (!expanded) {
              restoreFocus();
              setLocked(false);
              setHeaderRevealed(false);
            }
            setOpen(expanded);
          }}
        >
          <section
            ref={regionRef}
            data-root-global-panel=""
            data-state={open ? 'open' : 'closed'}
            aria-labelledby={`${id}-title`}
            aria-describedby={`${id}-description`}
            aria-hidden={!open}
            inert={!open}
            className="flex h-full min-h-0 flex-col bg-muted/50"
          >
            <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-4">
              <h2 id={`${id}-title`} className="truncate text-sm font-medium">
                Global panel
              </h2>
              <div className="flex items-center gap-1">
                {locked && header != null && (
                  <Button
                    ref={headerToggleRef}
                    variant="ghost"
                    size="icon-lg"
                    aria-label={
                      headerHidden ? 'Show app header' : 'Hide app header'
                    }
                    title={headerHidden ? 'Show app header' : 'Hide app header'}
                    aria-expanded={!headerHidden}
                    aria-controls={headerId}
                    onClick={toggleHeader}
                  >
                    {headerHidden ? <ChevronDown /> : <ChevronUp />}
                  </Button>
                )}
                <Button
                  ref={lockRef}
                  variant="ghost"
                  size="icon-lg"
                  aria-label={
                    locked ? 'Unlock global panel' : 'Lock global panel open'
                  }
                  title={
                    locked
                      ? 'Unlock to allow outside clicks and Escape to close the panel'
                      : 'Lock open and hide the app header; resizing and the close button still work'
                  }
                  aria-pressed={locked}
                  onClick={toggleLock}
                >
                  {locked ? <Lock /> : <LockOpen />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Close global panel"
                  onClick={close}
                >
                  <X />
                </Button>
              </div>
            </div>
            <p id={`${id}-description`} className="sr-only">
              Closes on an outside click or Escape unless locked open. Resizing
              and the close button always work. Locking hides the app header;
              use Show app header to reveal it.
            </p>
            <div
              data-slot="global-panel-scroll"
              role="group"
              aria-label="Global panel contents"
              tabIndex={0}
              className="min-h-0 flex-1 overflow-auto p-4 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            >
              {panel ?? (
                <p className="text-sm text-muted-foreground">
                  Nothing here yet. Utilities will live in this panel.
                </p>
              )}
            </div>
          </section>
        </ResizablePanel>
        <ResizableHandle
          data-global-panel-handle=""
          aria-label="Resize global panel"
          disableDoubleClick
        />
        <ResizablePanel defaultSize="100%" minSize="4rem">
          <div
            data-slot="shell-page"
            data-global-panel={open ? 'open' : 'closed'}
            role="group"
            aria-label="Work area"
            tabIndex={0}
            className="group/work-area flex h-full min-h-0 flex-col overflow-hidden outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
          >
            {children}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </PanelContext.Provider>
  );
}
