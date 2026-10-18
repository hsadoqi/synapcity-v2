'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import z from 'zod';
import { bodyFonts, codeFonts, headingFonts } from '../types/fonts';
import {
  densities,
  radii,
  themeSchema,
  type ThemeSettings,
  type ThemeSettingsPatch,
} from '../types/theme';
import { useThemeSettings } from './use-theme-settings';

/**
 * Session storage, not local: a draft belongs to this tab and this visit. The
 * key carries the owner's id from the `/[userId]/settings` route, so signing out
 * and in as someone else in the same tab never offers them the first person's
 * unsaved choices. Without a route id (tests, other mounts) it is the bare key.
 */
export function themeDraftStorageKey(userId?: string): string {
  return userId ? `synapcity-theme-draft:${userId}` : 'synapcity-theme-draft';
}

// Every field optional and none defaulted: a missing field means "not changed",
// never "changed to the default".
const draftSchema = z.object({
  mode: themeSchema.shape.mode.optional(),
  headingFont: z.enum(headingFonts).optional(),
  bodyFont: z.enum(bodyFonts).optional(),
  codeFont: z.enum(codeFonts).optional(),
  radius: z.enum(radii).optional(),
  density: z.enum(densities).optional(),
});

function readDraft(key: string): ThemeSettingsPatch {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return {};
    const parsed = draftSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

function writeDraft(key: string, changes: ThemeSettingsPatch) {
  try {
    if (Object.keys(changes).length === 0) {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, JSON.stringify(changes));
    }
  } catch {
    // Storage unavailable: the draft still works, it just won't outlive the page.
  }
}

/**
 * Theme choices held locally until they are saved, so the previews can show a
 * choice before the whole workspace switches to it.
 *
 * The draft is the saved theme with the local changes laid over it, not a copy
 * taken on mount: a value saved elsewhere (an import, another tab) still shows
 * through every field nobody has touched here. `save` sends only the fields that
 * differ from what is saved; `discard` drops them.
 *
 * Unsaved changes are kept in session storage, so leaving through an in-app link
 * (which the router does without a `beforeunload`) and coming back restores
 * them. Closing or reloading the page while anything is unsaved still asks first.
 */
export function useThemeDraft() {
  const { theme, updateTheme } = useThemeSettings();
  // Null outside the app router (tests): the bare key then applies.
  const userId = useParams<{ userId?: string }>()?.userId;
  const key = themeDraftStorageKey(userId);
  const [changes, setChanges] = useState<ThemeSettingsPatch>({});
  const restored = useRef(false);

  // Skips until the restore below has read storage, so the empty first render
  // never overwrites a stored draft.
  useEffect(() => {
    if (restored.current) writeDraft(key, changes);
  }, [key, changes]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const stored = readDraft(key);
      restored.current = true;
      if (Object.keys(stored).length > 0) {
        setChanges((current) => ({ ...stored, ...current }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const draft: ThemeSettings = { ...theme, ...changes };
  const unsaved = (Object.keys(changes) as (keyof ThemeSettings)[]).filter(
    (field) => changes[field] !== theme[field],
  );
  const hasChanges = unsaved.length > 0;

  const change = useCallback((patch: ThemeSettingsPatch) => {
    setChanges((current) => ({ ...current, ...patch }));
  }, []);

  const save = () => {
    updateTheme(
      Object.fromEntries(
        unsaved.map((field) => [field, draft[field]]),
      ) as ThemeSettingsPatch,
    );
    setChanges({});
  };

  const discard = useCallback(() => setChanges({}), []);

  useEffect(() => {
    if (!hasChanges) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasChanges]);

  return { draft, change, save, discard, hasChanges };
}
