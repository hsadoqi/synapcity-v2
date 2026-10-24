/*
 * jsdom has no matchMedia, which the system-signal hooks read. Default to a
 * light, motion-allowed viewport; a test that needs another replaces
 * `window.matchMedia`.
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
