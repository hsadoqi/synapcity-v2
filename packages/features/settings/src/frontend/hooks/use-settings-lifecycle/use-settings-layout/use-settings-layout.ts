'use client';

import { useMediaQuery } from '@synapcity/frontend-ui/hooks/use-media-query';

// Kept equal to the `roomy` variant in tailwind-config's tokens/variants.css:
// the classes lay the page out, and this decides what the markup itself must
// change with it (the tabs' orientation, which the arrow keys follow).
const ROOMY = '(min-width: 48rem) and (min-height: 40rem)';
// Tailwind's `xl`: room for a preview rail beside a tab's settings.
const WIDE = '(min-width: 80rem)';

// The server has no viewport, and a runtime without matchMedia listens to
// nothing: either way the layout is the small one.

/** Wide and tall enough for the side navigation and per-region scrolling. */
export const useRoomyLayout = () => useMediaQuery(ROOMY);

/** Room for a live preview rail beside a tab's settings. */
export const useWideLayout = () => useMediaQuery(WIDE);
