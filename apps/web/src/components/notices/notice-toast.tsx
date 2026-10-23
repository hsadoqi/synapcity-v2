'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@synapcity/frontend-ui/core/toast';

import {
  NOTICES,
  NOTICE_PARAM,
  isNoticeKey,
  noticeTimeout,
} from '@/lib/routing/notices';

/**
 * Shows the notice a redirect carried (`?notice=<key>`) as a toast, then
 * removes it from the address so a refresh or a shared link does not show it
 * again. Only keys in the fixed list are shown, exactly as that list defines
 * them (type, wording, duration, action); anything else is ignored.
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

    const notice = NOTICES[key];
    const id = `notice-${key}`;
    const { action } = notice;

    toast.add({
      id,
      type: notice.type,
      title: notice.title,
      description: notice.description,
      timeout: noticeTimeout(notice),
      // An error interrupts the screen reader; everything else waits its turn.
      priority: notice.type === 'error' ? 'high' : 'low',
      actionProps: action && {
        children: action.label,
        onClick: () => {
          toast.close(id);
          router.push(action.href);
        },
      },
    });

    const rest = new URLSearchParams(params.toString());
    rest.delete(NOTICE_PARAM);
    const query = rest.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [key, params, pathname, router]);

  return null;
}
