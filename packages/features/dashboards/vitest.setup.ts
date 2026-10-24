/*
 * jsdom has no matchMedia, which the tooltip and toggle components read
 * while rendering, and no ResizeObserver, which the grid measures with.
 * Default to a desktop, light, motion-allowed viewport.
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
