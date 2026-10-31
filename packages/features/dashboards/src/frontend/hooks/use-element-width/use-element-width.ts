'use client';

import { useCallback, useState } from 'react';

/**
 * An element's content width, kept current with a ResizeObserver; null until
 * measured. The ref is a callback ref, so the observer follows the element it
 * is attached to: one that mounts after the first render, or moves to another
 * element, is observed, and one that goes away is let go.
 */
export function useElementWidth<T extends HTMLElement>() {
  const [width, setWidth] = useState<number | null>(null);
  const ref = useCallback((element: T | null) => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}
