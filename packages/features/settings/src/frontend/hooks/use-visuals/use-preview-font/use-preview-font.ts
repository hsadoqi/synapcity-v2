'use client';

import { useEffect, useState } from 'react';
import { type FontChoice } from '@synapcity/domain-preferences';
import { loadFont } from '@synapcity/frontend-preferences';

/**
 * Fetches the family a preview shows, once, without applying it to the page,
 * and reports whether that request failed (blocked, offline, or Google Fonts
 * down). A failed family falls back to its generic font, so a preview that does
 * not say so would show a font the user never chose.
 */
export function usePreviewFont(choice: FontChoice): { failed: boolean } {
  const [failedFont, setFailedFont] = useState<FontChoice | null>(null);

  useEffect(() => {
    if (choice === 'default') return;
    const link = loadFont(document, choice);
    let active = true;
    const check = () => {
      if (active) {
        setFailedFont(link.dataset.status === 'failed' ? choice : null);
      }
    };
    // The request may have settled before this preview mounted.
    queueMicrotask(check);
    link.addEventListener('load', check);
    link.addEventListener('error', check);
    return () => {
      active = false;
      link.removeEventListener('load', check);
      link.removeEventListener('error', check);
    };
  }, [choice]);

  // Keyed by font, so switching to another choice never shows a stale failure.
  return { failed: failedFont === choice };
}
