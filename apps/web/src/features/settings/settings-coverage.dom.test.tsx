import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppearanceSettings } from './components/appearance-settings';
import { DataPrivacySettings } from './components/data-privacy-settings';
import { NotificationSettings } from './components/notification-settings';
import { RegionalSettings } from './components/regional-settings';
import { ThemeSettings } from './components/theme-settings';
import { renderWithSettings, stubBrowser } from './test-harness';
import { appearanceSchema } from './types/appearance';
import { dataPrivacySchema } from './types/data-privacy';
import { transferSchema } from './types/import-export';
import { notificationsSchema } from './types/notifications';
import { regionalSchema } from './types/regional';
import { themeSchema } from './types/theme';

beforeEach(stubBrowser);
afterEach(() => vi.unstubAllGlobals());

type Control = { role: 'combobox' | 'switch' | 'status'; name: string };

// Every setting the Theme, Appearance, Regional, Notifications and Data privacy
// tabs own has a control named here. A field added to any of those schemas fails this test until it gets one, so a setting
// cannot be saved, exported and imported without anyone being able to change it.
// `colorScheme` is the one exception: it mirrors `theme.mode`, which the Theme
// tab owns, and mergeSettings keeps the two equal.
const themeControls: Record<keyof typeof themeSchema.shape, Control> = {
  mode: { role: 'combobox', name: 'Color theme' },
  headingFont: { role: 'combobox', name: 'Heading font' },
  bodyFont: { role: 'combobox', name: 'Body font' },
  codeFont: { role: 'combobox', name: 'Monospace font' },
  radius: { role: 'combobox', name: 'Corner radius' },
  density: { role: 'combobox', name: 'Density' },
  textSize: { role: 'status', name: 'Text size' },
};

const appearanceControls: Record<
  Exclude<keyof typeof appearanceSchema.shape, 'colorScheme'>,
  Control
> = {
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

const privacyControls: Record<keyof typeof dataPrivacySchema.shape, Control> = {
  analytics: { role: 'switch', name: 'Activity tracking' },
  errorReports: { role: 'switch', name: 'Error reports' },
  sharing: { role: 'switch', name: 'Data sharing with third parties' },
};

const notificationControls: Record<
  keyof typeof notificationsSchema.shape,
  Control
> = {
  email: { role: 'switch', name: 'Email notifications' },
  push: { role: 'switch', name: 'Push notifications' },
  sound: { role: 'switch', name: 'Notification sounds' },
};

// Every section an export file carries is listed here, so a section added to
// the transfer cannot be exported and imported without a tab to change it.
const transferredSections: Record<keyof typeof transferSchema.shape, unknown> =
  {
    theme: themeControls,
    appearance: appearanceControls,
    regional: regionalControls,
    privacy: privacyControls,
    notifications: notificationControls,
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

  it('names a control for every notification setting', () => {
    expect(Object.keys(notificationControls).sort()).toEqual(
      Object.keys(notificationsSchema.shape).sort(),
    );
  });

  it('names a control for every data privacy setting', () => {
    expect(Object.keys(privacyControls).sort()).toEqual(
      Object.keys(dataPrivacySchema.shape).sort(),
    );
  });

  it('covers every section an export file carries', () => {
    expect(Object.keys(transferredSections).sort()).toEqual(
      Object.keys(transferSchema.shape).sort(),
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

  it.each(Object.entries(notificationControls))(
    'the Notifications tab renders %s',
    async (_key, { role, name }) => {
      await renderWithSettings(<NotificationSettings />);
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
