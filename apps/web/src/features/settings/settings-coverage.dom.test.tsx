import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppearanceSettings } from './components/appearance-settings';
import { DataPrivacySettings } from './components/data-privacy-settings';
import { RegionalSettings } from './components/regional-settings';
import { ThemeSettings } from './components/theme-settings';
import { renderWithSettings, stubBrowser } from './test-harness';
import { appearanceSchema } from './types/appearance';
import { dataPrivacySchema } from './types/data-privacy';
import { regionalSchema } from './types/regional';
import { themeSchema } from './types/theme';

beforeEach(stubBrowser);
afterEach(() => vi.unstubAllGlobals());

type Control = { role: 'combobox' | 'switch'; name: string };

// Every setting the Theme, Appearance, Regional and Data privacy tabs own has a control named here. A
// field added to either schema fails this test until it gets one, so a setting
// cannot be saved, exported and imported without anyone being able to change it.
// `colorScheme` is the one exception: it mirrors `theme.mode`, which the Theme
// tab owns, and mergeSettings keeps the two equal.
const themeControls: Record<keyof typeof themeSchema.shape, Control> = {
  mode: { role: 'combobox', name: 'Color theme' },
  headingFont: { role: 'combobox', name: 'Heading font' },
  bodyFont: { role: 'combobox', name: 'Body font' },
  codeFont: { role: 'combobox', name: 'Monospace font' },
};

const appearanceControls: Record<
  Exclude<keyof typeof appearanceSchema.shape, 'colorScheme'>,
  Control
> = {
  fontSize: { role: 'combobox', name: 'Text size' },
  contrastMode: { role: 'combobox', name: 'Contrast' },
  showBorders: { role: 'switch', name: 'Show component borders' },
  animationsEnabled: { role: 'switch', name: 'Enable animations' },
  reducedMotion: { role: 'switch', name: 'Reduce motion' },
};

const regionalControls: Record<keyof typeof regionalSchema.shape, Control> = {
  language: { role: 'combobox', name: 'Preferred language' },
  timezone: { role: 'combobox', name: 'Timezone' },
  timeFormat: { role: 'combobox', name: 'Time format' },
  dateFormat: { role: 'combobox', name: 'Date format' },
  firstDayOfWeek: { role: 'combobox', name: 'First day of the week' },
  numberFormat: { role: 'combobox', name: 'Number format' },
};

// `policyVersion` is recorded with each choice, not chosen.
const privacyControls: Record<
  Exclude<keyof typeof dataPrivacySchema.shape, 'policyVersion'>,
  Control
> = {
  analytics: { role: 'switch', name: 'Activity tracking' },
  errorReports: { role: 'switch', name: 'Error reports' },
  sharing: { role: 'switch', name: 'Data sharing with third parties' },
};

describe('settings with a control', () => {
  it('names a control for every theme setting', () => {
    expect(Object.keys(themeControls).sort()).toEqual(
      Object.keys(themeSchema.shape).sort(),
    );
  });

  it('names a control for every appearance setting except the mirrored one', () => {
    expect(Object.keys(appearanceControls).sort()).toEqual(
      Object.keys(appearanceSchema.shape)
        .filter((key) => key !== 'colorScheme')
        .sort(),
    );
  });

  it('names a control for every regional setting', () => {
    expect(Object.keys(regionalControls).sort()).toEqual(
      Object.keys(regionalSchema.shape).sort(),
    );
  });

  it('names a control for every data privacy setting', () => {
    expect(Object.keys(privacyControls).sort()).toEqual(
      Object.keys(dataPrivacySchema.shape)
        .filter((key) => key !== 'policyVersion')
        .sort(),
    );
  });

  it.each(Object.entries(themeControls))(
    'the Theme tab renders %s',
    async (_key, { role, name }) => {
      await renderWithSettings(<ThemeSettings />);
      expect(screen.getByRole(role, { name })).toBeTruthy();
    },
  );

  it.each(Object.entries(appearanceControls))(
    'the Appearance tab renders %s',
    async (_key, { role, name }) => {
      await renderWithSettings(<AppearanceSettings />);
      expect(screen.getByRole(role, { name })).toBeTruthy();
    },
  );

  it.each(Object.entries(regionalControls))(
    'the Regional tab renders %s',
    async (_key, { role, name }) => {
      await renderWithSettings(<RegionalSettings />);
      expect(screen.getByRole(role, { name })).toBeTruthy();
    },
  );

  it.each(Object.entries(privacyControls))(
    'the Data privacy tab renders %s',
    async (_key, { role, name }) => {
      await renderWithSettings(<DataPrivacySettings />);
      expect(screen.getByRole(role, { name })).toBeTruthy();
    },
  );
});
