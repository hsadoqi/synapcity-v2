/*
 * jsdom has no ResizeObserver, which the grid measures with, and no Web Animations
 * `getAnimations`, which the scroll area (the agenda's slot list) calls on a timer after it
 * mounts. `matchMedia` comes from the shared setup in dev-vitest-config.
 */
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
