import { vi } from 'vitest';

/** What the test pretends the device is. Anything left out is the default desktop. */
export interface Viewport {
  /** Window width in CSS pixels. Defaults to a desktop of 1280. */
  readonly width?: number;
  /** The device asks for a dark color scheme. Defaults to light. */
  readonly dark?: boolean;
  /** The device asks for reduced motion. Defaults to motion allowed. */
  readonly reducedMotion?: boolean;
}

const px = (query: string, feature: 'min-width' | 'max-width') => {
  const found = new RegExp(`${feature}:\\s*(\\d+(?:\\.\\d+)?)px`).exec(query);
  return found ? Number(found[1]) : undefined;
};

/**
 * Whether a media query holds for the viewport. It understands the three kinds of query the code
 * asks, `prefers-color-scheme`, `prefers-reduced-motion` and `min-width` / `max-width` in pixels,
 * and treats any other query as not matching.
 */
function matches(query: string, viewport: Required<Viewport>): boolean {
  const text = query.toLowerCase();
  if (text.includes('prefers-color-scheme')) {
    return text.includes('dark') ? viewport.dark : !viewport.dark;
  }
  if (text.includes('prefers-reduced-motion')) {
    return text.includes('reduce')
      ? viewport.reducedMotion
      : !viewport.reducedMotion;
  }
  const min = px(text, 'min-width');
  const max = px(text, 'max-width');
  if (min === undefined && max === undefined) return false;
  return (
    (min === undefined || viewport.width >= min) &&
    (max === undefined || viewport.width <= max)
  );
}

/**
 * Makes `matchMedia` and `innerWidth` describe one device, for a test that needs a viewport other
 * than the default. The change lasts until `vi.unstubAllGlobals()`. Listeners are accepted and never
 * called, so a test that needs a viewport to change mid-test calls this again and re-renders.
 */
export function mockViewport({
  width = 1280,
  dark = false,
  reducedMotion = false,
}: Viewport = {}): void {
  const viewport = { width, dark, reducedMotion };
  vi.stubGlobal('innerWidth', width);
  vi.stubGlobal('matchMedia', (media: string) => ({
    matches: matches(media, viewport),
    media,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}
