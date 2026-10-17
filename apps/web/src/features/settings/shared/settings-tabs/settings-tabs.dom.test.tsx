import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import tabs from '../../lib/data/tabs';
import { renderWithSettings, stubBrowser } from '../../test-harness';
import { SettingsTabs } from './settings-tabs';

beforeEach(() => {
  stubBrowser();
  window.location.hash = '';
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.location.hash = '';
});

const tab = (value: string) => tabs.find((entry) => entry.value === value)!;

describe('SettingsTabs', () => {
  // Opening a link such as /settings#regional once drew the Theme tab first,
  // then swapped to Regional: the content flashed and the page height jumped
  // twice while each tab loaded.
  it('opens the tab named in the URL without loading the Theme tab first', async () => {
    const loadTheme = vi.spyOn(tab('theme'), 'component');
    window.location.hash = 'regional';

    await renderWithSettings(<SettingsTabs />);

    expect(
      await screen.findByRole(
        'combobox',
        { name: 'Preferred language' },
        { timeout: 5000 },
      ),
    ).toBeTruthy();
    expect(
      screen
        .getByRole('tab', { name: 'Regional' })
        .getAttribute('aria-selected'),
    ).toBe('true');
    expect(loadTheme).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('combobox', { name: 'Color theme', hidden: true }),
    ).toBeNull();
  });

  it('opens on the Theme tab when the URL names none', async () => {
    await renderWithSettings(<SettingsTabs />);

    expect(
      await screen.findByRole(
        'combobox',
        { name: 'Color theme' },
        { timeout: 5000 },
      ),
    ).toBeTruthy();
  });
});
