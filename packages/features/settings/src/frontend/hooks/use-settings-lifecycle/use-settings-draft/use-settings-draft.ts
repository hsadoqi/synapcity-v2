'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { z } from 'zod';
import type { Settings } from '@synapcity/domain-preferences';
import { appearanceSchema } from '@synapcity/domain-preferences';
import { dataPrivacySchema } from '@synapcity/domain-preferences';
import { notificationsSchema } from '@synapcity/domain-preferences';
import { regionalSchema } from '@synapcity/domain-preferences';
import { settingsDefaults } from '@synapcity/domain-preferences';
import { themeSchema } from '@synapcity/domain-preferences';
import { useRegisterSettingsDraft } from '../../../components/shared/settings-drafts';
import { useSettings } from '../use-settings';

export type DraftSection = keyof Settings;

const sectionSchemas: Record<DraftSection, z.ZodObject> = {
  regional: regionalSchema,
  appearance: appearanceSchema,
  notifications: notificationsSchema,
  privacy: dataPrivacySchema,
  theme: themeSchema,
};

/**
 * Session storage, not local: a draft belongs to this tab and this visit. The
 * key carries the owner's id from the `/[userId]/settings` route, so signing out
 * and in as someone else in the same tab never offers them the first person's
 * unsaved choices. Without a route id (tests, other mounts) it is the bare key.
 */
export function settingsDraftStorageKey(
  section: DraftSection,
  userId?: string,
): string {
  const key = `synapcity-${section}-draft`;
  return userId ? `${key}:${userId}` : key;
}

type Changes<S extends DraftSection> = Partial<Settings[S]>;

// Field by field, and only the fields present: a missing field means "not
// changed", never "changed to the default", and one unrecognised value drops
// only itself.
function readDraft<S extends DraftSection>(
  section: S,
  key: string,
): Changes<S> {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return {};
    const stored: unknown = JSON.parse(raw);
    if (!stored || typeof stored !== 'object' || Array.isArray(stored))
      return {};
    const shape = sectionSchemas[section].shape;
    return Object.fromEntries(
      Object.entries(stored).flatMap(([field, value]) => {
        const schema = shape[field];
        if (!schema) return [];
        const parsed = schema.safeParse(value);
        return parsed.success ? [[field, parsed.data]] : [];
      }),
    ) as Changes<S>;
  } catch {
    return {};
  }
}

function writeDraft(key: string, changes: object) {
  try {
    if (Object.keys(changes).length === 0) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(changes));
  } catch {
    // Storage unavailable: the draft still works, it just won't outlive the page.
  }
}

const sameJson = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

/**
 * One settings tab's choices, held locally until they are saved: the previews
 * show a choice before the workspace switches to it, and saving sends the tab's
 * changes in one write instead of one per change.
 *
 * The draft is the saved section with the local changes laid over it, not a
 * copy taken on mount: a value saved elsewhere (an import, another tab) still
 * shows through every field nobody has touched here. `save` sends only the
 * fields that differ from what is saved; `discard` drops them. `resetField` and
 * `resetAll` put defaults into the draft, so they too wait for a save and
 * Discard undoes them.
 *
 * Unsaved changes are kept in session storage, so leaving by a route the guard
 * cannot stop (the browser's back button) and coming back restores them.
 * Closing or reloading the page while anything is unsaved asks first.
 */
export function useSettingsDraft<S extends DraftSection>(
  section: S,
  options: {
    /**
     * Whether a draft value means the same as another. Defaults to equal JSON;
     * a consent record compares only whether it is granted, since each choice
     * carries the time it was made.
     */
    same?: (field: keyof Settings[S], a: unknown, b: unknown) => boolean;
    /**
     * The fields this tab shows, which reset covers. Defaults to every field
     * of the section; Display leaves out `colorScheme`, the Theme tab's mode.
     */
    fields?: readonly (keyof Settings[S])[];
  } = {},
) {
  const { settings, updateSettings, draftScope } = useSettings();
  const saved = settings[section];
  const defaults = settingsDefaults[section];
  const same = options.same ?? ((_field, a, b) => sameJson(a, b));
  const key = settingsDraftStorageKey(section, draftScope);
  const [changes, setChanges] = useState<Changes<S>>({});
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
      const stored = readDraft(section, key);
      restored.current = true;
      if (Object.keys(stored).length > 0) {
        setChanges((current) => ({ ...stored, ...current }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [section, key]);

  type Field = keyof Settings[S];
  const fields = options.fields ?? (Object.keys(saved) as Field[]);
  const draft = { ...saved, ...changes } as Settings[S];
  const unsaved = (Object.keys(changes) as Field[]).filter(
    (field) => !same(field, changes[field], saved[field]),
  );
  const hasChanges = unsaved.length > 0;
  const isUnsaved = (field: Field) => unsaved.includes(field);
  const isDefault = (field: Field) =>
    same(field, draft[field], defaults[field]);
  const atDefaults = fields.every(isDefault);

  const change = useCallback((patch: Changes<S>) => {
    setChanges((current) => ({ ...current, ...patch }));
  }, []);

  const resetField = (field: Field) =>
    change({ [field]: defaults[field] } as Changes<S>);

  const resetAll = () =>
    change(
      Object.fromEntries(
        fields.map((field) => [field, defaults[field]]),
      ) as Changes<S>,
    );

  const save = () => {
    if (!hasChanges) return;
    updateSettings({
      [section]: Object.fromEntries(
        unsaved.map((field) => [field, draft[field]]),
      ),
    });
    setChanges({});
  };

  const discard = useCallback(() => setChanges({}), []);

  useRegisterSettingsDraft(section, { hasChanges, save, discard });

  useEffect(() => {
    if (!hasChanges) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Chrome and Edge before 119 only ask when a return value is set.
      Object.assign(event, { returnValue: '' });
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasChanges]);

  return {
    saved,
    draft,
    change,
    save,
    discard,
    hasChanges,
    unsavedCount: unsaved.length,
    isUnsaved,
    isDefault,
    atDefaults,
    resetField,
    resetAll,
  };
}
