import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import tabs from '../../lib/data';
import { renderWithSettings, stubBrowser } from '../../testing';
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

// Each tab loads lazily, and these tests wait up to 5 s for it. The test's own
// limit must be longer, or a slow machine cuts it off before that wait ends.
const LOADING_TIMEOUT = 30_000;
// How long to wait for a lazily loaded tab; stays under the test timeout.
const FIND_TIMEOUT = 10_000;

describe('SettingsTabs', () => {
  // Opening a link such as /settings#regional once drew the default tab first,
  // then swapped to Regional: the content flashed and the page height jumped
  // twice while each tab loaded. The default is Account.
  it(
    'opens the tab named in the URL without loading the Account tab first',
    async () => {
      const loadAccount = vi.spyOn(tab('account'), 'component');
      // Regional's own tests cover its fields; loading the real tab here
      // pulls in the language and timezone data and times out under coverage.
      vi.spyOn(tab('regional'), 'component').mockResolvedValue(() => (
        <p>Regional panel</p>
      ));
      window.location.hash = 'regional';

      await renderWithSettings(<SettingsTabs />);

      expect(
        await screen.findByText(
          'Regional panel',
          {},
          { timeout: FIND_TIMEOUT },
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
    },
    LOADING_TIMEOUT,
  );

  // Account reads the signed-in user and server actions, which its own tests
  // mock; here a stand-in shows which tab opened.
  it(
    'opens on the Account tab when the URL names none',
    async () => {
      vi.spyOn(tab('account'), 'component').mockResolvedValue(() => (
        <p>Account panel</p>
      ));

      await renderWithSettings(<SettingsTabs />);

      expect(
        await screen.findByText('Account panel', {}, { timeout: FIND_TIMEOUT }),
      ).toBeTruthy();
      expect(
        screen
          .getByRole('tab', { name: 'Account' })
          .getAttribute('aria-selected'),
      ).toBe('true');
    },
    LOADING_TIMEOUT,
  );
});
