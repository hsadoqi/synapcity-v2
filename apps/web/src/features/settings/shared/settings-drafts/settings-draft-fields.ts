'use client';

import { createContext, useContext } from 'react';

/**
 * A tab's draft as each of its rows sees it: whether the row's field is
 * unsaved, whether it differs from its default, and how to reset it. Provided
 * by `SettingsTabShell` for a tab with a draft; null elsewhere, where a row
 * shows neither mark nor reset.
 */
export type SettingsDraftFieldsValue = {
  isUnsaved: (field: string) => boolean;
  isDefault: (field: string) => boolean;
  resetField: (field: string) => void;
};

export const SettingsDraftFields =
  createContext<SettingsDraftFieldsValue | null>(null);

export const useSettingsDraftFields = () => useContext(SettingsDraftFields);
