/*
 * jsdom has no matchMedia, which the sidebar (useIsMobile) and the theme
 * provider read while rendering. Default to a desktop, light, motion-allowed
 * viewport; a test that needs another viewport replaces `window.matchMedia`.
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
