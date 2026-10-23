'use client';

// TODO: Does this just handle success? Add functionality to handle different use cases and types.
import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@synapcity/frontend-ui/core/toast';

import { NOTICES, NOTICE_PARAM, isNoticeKey } from '@/lib/routing/notices';

/**
 * Shows the confirmation a redirect carried (`?notice=<key>`) as a toast, then
 * removes it from the address so a refresh or a shared link does not show it
 * again. Only keys in the fixed list are shown; anything else is ignored.
 * Renders nothing. Mount it once, inside a Suspense boundary.
 */
export function NoticeToast() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const key = params.get(NOTICE_PARAM);
  // Development runs effects twice; the toast id also makes a repeat harmless.
  const shown = useRef<string | null>(null);

  useEffect(() => {
    // The parameter is gone (it was removed below, or never there): forget the
    // last one, so the same notice can appear again later in this session.
    if (!key) {
      shown.current = null;
      return;
    }
    if (!isNoticeKey(key) || shown.current === key) return;
    shown.current = key;

    toast.add({ id: `notice-${key}`, type: 'success', title: NOTICES[key] });

    const rest = new URLSearchParams(params.toString());
    rest.delete(NOTICE_PARAM);
    const query = rest.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [key, params, pathname, router]);

  return null;
}
