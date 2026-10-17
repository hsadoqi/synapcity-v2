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
  // Opening a link such as /settings#regional once drew the default tab first,
  // then swapped to Regional: the content flashed and the page height jumped
  // twice while each tab loaded. The default is Account.
  it('opens the tab named in the URL without loading the Account tab first', async () => {
    const loadAccount = vi.spyOn(tab('account'), 'component');
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
    expect(loadAccount).not.toHaveBeenCalled();
    expect(
      screen
        .getByRole('tab', { name: 'Account' })
        .getAttribute('aria-selected'),
    ).toBe('false');
  });

  // Account reads the signed-in user and server actions, which its own tests
  // mock; here a stand-in shows which tab opened.
  it('opens on the Account tab when the URL names none', async () => {
    vi.spyOn(tab('account'), 'component').mockResolvedValue(() => (
      <p>Account panel</p>
    ));

    await renderWithSettings(<SettingsTabs />);

    expect(
      await screen.findByText('Account panel', {}, { timeout: 5000 }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole('tab', { name: 'Account' })
        .getAttribute('aria-selected'),
    ).toBe('true');
  });
});
