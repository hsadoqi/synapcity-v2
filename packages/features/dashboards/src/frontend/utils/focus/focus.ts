const PALETTE_BUTTON = '[data-slot="widget-palette"] button';

/** How long a palette focus handoff waits for the panel to open: its 200 ms glide, plus margin. */
export const PALETTE_FOCUS_TIMEOUT_MS = 400;

/** The handoff in progress, if any; a new one replaces it. */
let pending: (() => void) | undefined;

/**
 * After the palette has focus, the host's panel may still move focus to its
 * own region (it does so when it finishes opening). The handoff keeps watching
 * for this long and takes focus back, but only from `<body>` or a
 * non-interactive `tabindex="-1"` container; focus the person or the app put
 * anywhere else is left alone.
 */
export const PALETTE_FOCUS_SETTLE_MS = 150;

/** Focus sitting where nothing can be operated: the page body, or a container made focusable only by script. */
function isStolen(active: Element | null, palette: HTMLElement): boolean {
  if (!active || active === document.body) return true;
  return active.getAttribute('tabindex') === '-1' && !palette.contains(active);
}

/** Whether focus could land on the element: nothing around it is inert or hidden. */
function isInteractable(element: HTMLElement): boolean {
  return element.closest('[inert], [hidden]') === null;
}

/**
 * Hands focus to the first button of the widgets palette once it can take
 * it. The palette appears with edit mode and may sit in a panel that is still
 * opening (its region is inert until it has), so the handoff looks once per
 * frame, for at most `timeoutMs`, and never focuses content that is inert or
 * hidden. Once focus has landed it keeps watching for `PALETTE_FOCUS_SETTLE_MS`,
 * so a host that moves focus to its own region as it finishes opening does not
 * win. It ends when that time has passed; when the person presses a key or
 * pointer first (they have taken over); when a newer handoff replaces it; and
 * when the returned function is called (the caller unmounted, or the panel
 * closed or changed destination).
 */
export function focusPalette(
  root: ParentNode = document,
  { timeoutMs = PALETTE_FOCUS_TIMEOUT_MS }: { timeoutMs?: number } = {},
): () => void {
  pending?.();
  let frame = 0;
  let ended = false;
  const startedAt = performance.now();
  /** When focus first landed on the palette; undefined until it does. */
  let settledAt: number | undefined;
  const end = () => {
    if (ended) return;
    ended = true;
    cancelAnimationFrame(frame);
    document.removeEventListener('keydown', end, true);
    document.removeEventListener('pointerdown', end, true);
    if (pending === end) pending = undefined;
  };
  const attempt = () => {
    if (ended) return;
    const button = root.querySelector<HTMLElement>(PALETTE_BUTTON);
    if (button && isInteractable(button)) {
      if (settledAt === undefined) {
        button.focus();
        settledAt = performance.now();
      } else if (isStolen(document.activeElement, button)) {
        button.focus();
      }
    } else if (
      settledAt === undefined &&
      performance.now() - startedAt >= timeoutMs
    ) {
      end();
      return;
    }
    // The settle window ends the handoff even if the palette went away or
    // turned inert in the meantime (its panel closed without cancelling).
    if (
      settledAt !== undefined &&
      performance.now() - settledAt >= PALETTE_FOCUS_SETTLE_MS
    ) {
      end();
      return;
    }
    frame = requestAnimationFrame(attempt);
  };
  document.addEventListener('keydown', end, true);
  document.addEventListener('pointerdown', end, true);
  pending = end;
  frame = requestAnimationFrame(attempt);
  return end;
}

/**
 * Moves focus to a widget's grid cell, which takes focus in edit mode.
 * Returns false when there is no such cell or it cannot take focus now (it is
 * inert behind a panel that covers the canvas), so the caller can leave focus
 * where it is.
 */
export function focusWidget(id: string, root: ParentNode = document): boolean {
  // Matched by dataset, not a selector, so an id never needs escaping.
  const cell = [...root.querySelectorAll<HTMLElement>('[data-widget-id]')].find(
    (candidate) => candidate.dataset.widgetId === id,
  );
  if (!cell || !isInteractable(cell)) return false;
  cell.focus();
  return true;
}
