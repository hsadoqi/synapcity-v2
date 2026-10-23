'use client';

import { createContext, useContext } from 'react';

/**
 * Whether the settings tab around a component is the one shown. A visited tab
 * stays mounted while hidden (so its draft survives), so anything it floats
 * outside itself, such as a popover, must close when this turns false. True
 * outside `SettingsTabs`, where a tab is rendered on its own.
 */
export const SettingsTabActive = createContext(true);

export const useSettingsTabActive = () => useContext(SettingsTabActive);
