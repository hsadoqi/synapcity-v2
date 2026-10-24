'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@synapcity/frontend-ui/core/alert-dialog';
import { Button } from '@synapcity/frontend-ui/core/button';
import { settingsTabItems } from '../../lib/data/tab-items';
import { useSettingsDrafts } from './settings-drafts';

// A draft's section is its key in the settings; the tab list names it for people.
const sectionTab: Record<string, string> = {
  privacy: 'data-privacy',
};
const tabLabel = (section: string) =>
  settingsTabItems.find((tab) => tab.value === (sectionTab[section] ?? section))
    ?.label ?? section;

/** The in-app link this click would leave the page by, or null to let it be. */
function leavingBy(event: MouseEvent): HTMLAnchorElement | null {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return null;
  const link = (event.target as Element | null)?.closest?.('a[href]');
  if (!(link instanceof HTMLAnchorElement)) return null;
  if (link.target && link.target !== '_self') return null;
  if (link.hasAttribute('download')) return null;
  const to = new URL(link.href, window.location.href);
  if (to.origin !== window.location.origin) return null;
  // A tab's #hash, or this same page: nothing is left behind.
  if (
    to.pathname === window.location.pathname &&
    to.search === window.location.search
  )
    return null;
  return link;
}

/**
 * Asks before an in-app link leaves the settings page with unsaved changes in
 * any tab. Next has no router-wide way to hold a navigation (only `onNavigate`
 * on each Link, and the shell's links live in the UI package), so this catches
 * the click itself, in the capture phase, before the Link's own handler. Once
 * the drafts are saved or discarded the same link is clicked again and let
 * through, so the Link navigates as it always does (prefetch, scroll).
 * Closing or reloading the page is asked about by each draft (`beforeunload`);
 * the browser's back button cannot be held, and the drafts are restored from
 * session storage on return instead.
 */
export function UnsavedChangesGuard() {
  const drafts = useSettingsDrafts();
  const [pending, setPending] = useState<{
    link: HTMLAnchorElement;
    tabs: string[];
  } | null>(null);
  // Lets the repeated click through: the drafts' own state has not caught up
  // with the save or discard by the time it is dispatched.
  const letThrough = useRef(false);

  useEffect(() => {
    if (!drafts) return;
    const onClick = (event: MouseEvent) => {
      if (letThrough.current) {
        letThrough.current = false;
        return;
      }
      const link = leavingBy(event);
      if (!link) return;
      const unsaved = drafts.unsaved();
      if (unsaved.length === 0) return;
      event.preventDefault();
      event.stopPropagation();
      setPending({ link, tabs: unsaved.map((d) => tabLabel(d.section)) });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [drafts]);

  const leave = (action: 'save' | 'discard') => {
    if (!pending || !drafts) return;
    for (const draft of drafts.unsaved()) draft[action]();
    const { link } = pending;
    setPending(null);
    letThrough.current = true;
    link.click();
  };

  const list = pending
    ? new Intl.ListFormat('en', { type: 'conjunction' }).format(pending.tabs)
    : '';

  return (
    <AlertDialog
      open={pending !== null}
      onOpenChange={(open) => {
        if (!open) setPending(null);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave with unsaved changes?</AlertDialogTitle>
          <AlertDialogDescription>
            {list} {pending?.tabs.length === 1 ? 'has' : 'have'} changes you
            have not saved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="ghost">Keep editing</AlertDialogCancel>
          <Button variant="outline" onClick={() => leave('discard')}>
            Discard
          </Button>
          <AlertDialogAction onClick={() => leave('save')}>
            Save
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
