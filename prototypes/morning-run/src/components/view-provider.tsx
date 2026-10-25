'use client';

import {
  createContext,
  use,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { VIEW_COOKIE, VIEW_META, type View } from '@/lib/view';

type ViewContextValue = { view: View; setView: (view: View) => void };

const ViewContext = createContext<ViewContextValue | null>(null);

/**
 * The active view. The server reads it from a cookie so the first paint already has the right
 * colours; switching writes the cookie and updates the root element without a reload.
 */
export function ViewProvider({
  initial,
  children,
}: {
  initial: View;
  children: ReactNode;
}) {
  const [view, setViewState] = useState<View>(initial);

  const setView = useCallback((next: View) => {
    setViewState(next);
    const root = document.documentElement;
    root.dataset.view = next;
    root.dataset.tone = VIEW_META[next].tone;
    document.cookie = `${VIEW_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const value = useMemo(() => ({ view, setView }), [view, setView]);
  return <ViewContext value={value}>{children}</ViewContext>;
}

export function useView(): ViewContextValue {
  const ctx = use(ViewContext);
  if (!ctx) throw new Error('useView must be used inside ViewProvider');
  return ctx;
}
