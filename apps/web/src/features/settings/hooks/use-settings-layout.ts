'use client';

import { useSyncExternalStore } from 'react';

// Kept equal to the `roomy` variant in tailwind-config's tokens/variants.css:
// the classes lay the page out, and this decides what the markup itself must
// change with it (the tabs' orientation, which the arrow keys follow).
const ROOMY = '(min-width: 48rem) and (min-height: 40rem)';
// Tailwind's `xl`: room for a preview rail beside a tab's settings.
const WIDE = '(min-width: 80rem)';

// A test runner between stubs or an embedded webview may lack matchMedia;
// without it the layout is the small one, and nothing is listened to.
const canMatch = () => typeof window.matchMedia === 'function';

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (!canMatch()) return () => {};
      const media = window.matchMedia(query);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    () => canMatch() && window.matchMedia(query).matches,
    // The server has no viewport: it renders the small layout.
    () => false,
  );
}

/** Wide and tall enough for the side navigation and per-region scrolling. */
export const useRoomyLayout = () => useMediaQuery(ROOMY);

/** Room for a live preview rail beside a tab's settings. */
export const useWideLayout = () => useMediaQuery(WIDE);
