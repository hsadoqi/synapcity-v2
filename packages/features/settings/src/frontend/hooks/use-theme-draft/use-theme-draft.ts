'use client';

import {
  settingsDraftStorageKey,
  useSettingsDraft,
} from '../use-settings-draft';

/** Where the Theme tab's unsaved choices are kept; see `useSettingsDraft`. */
export function themeDraftStorageKey(userId?: string): string {
  return settingsDraftStorageKey('theme', userId);
}

/** The Theme tab's draft: previews show a choice before the workspace does. */
export function useThemeDraft() {
  return useSettingsDraft('theme');
}
