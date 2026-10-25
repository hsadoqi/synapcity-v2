/*
 * jsdom has no `matchMedia`, which the sidebar (`useIsMobile`), the theme provider and the
 * system-signal hooks read while rendering. This installs a desktop, light, motion-allowed
 * viewport when the environment has none; a test that needs another viewport uses `mockViewport`
 * from `./viewport`.
 *
 * Only `matchMedia` is shared. `ResizeObserver` and `Element.prototype.getAnimations` are not,
 * because their absence is itself behavior: Base UI waits for `getAnimations()` before it unmounts
 * an exiting panel, and a windowed list switches on when `ResizeObserver` exists. A test or
 * package that needs either supplies it.
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
