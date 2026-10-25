/*
 * What jsdom lacks and components read while rendering. Each is installed only when missing, so a
 * test environment that has it, or a test that replaces it, is left alone.
 *
 * - `matchMedia`: the sidebar (`useIsMobile`), the theme provider and the system-signal hooks
 *   read it. The default is a desktop, light, motion-allowed viewport; a test that needs another
 *   viewport uses `mockViewport` from `./viewport`.
 * - `ResizeObserver`: the grid and other measured layouts construct one.
 * - `Element.prototype.getAnimations`: the scroll area calls it on a timer after it mounts.
 */
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = ((media: string) => ({
    matches: false,
    media,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

if (
  typeof window !== 'undefined' &&
  typeof window.ResizeObserver !== 'function'
) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof window.ResizeObserver;
}

if (
  typeof Element !== 'undefined' &&
  typeof Element.prototype.getAnimations !== 'function'
) {
  Element.prototype.getAnimations = () => [];
}
