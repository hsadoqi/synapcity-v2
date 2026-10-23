import { fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  currentSettings,
  renderWithSettings,
  saveTab,
  stubBrowser,
} from '../../test-harness';
import { PRIVACY_POLICY_VERSIONS } from '../../types/data-privacy';
import { DataPrivacySettings } from './index';

beforeEach(stubBrowser);
afterEach(() => {
  vi.unstubAllGlobals();
  // Set as an own property by the Global Privacy Control tests.
  delete (navigator as { globalPrivacyControl?: boolean }).globalPrivacyControl;
});

const checked = (name: string) =>
  screen.getByRole('switch', { name }).getAttribute('aria-checked');

describe('DataPrivacySettings', () => {
  it('shows every switch off by default, with the disclaimer', async () => {
    await renderWithSettings(<DataPrivacySettings />);

    expect(screen.getAllByRole('switch')).toHaveLength(3);
    for (const toggle of screen.getAllByRole('switch')) {
      expect(toggle.getAttribute('aria-checked')).toBe('false');
    }
    expect(
      screen.getByText(/No usage data or error reports are sent/),
    ).toBeTruthy();
  });

  it.each([
    ['Activity tracking', 'analytics'],
    ['Error reports', 'errorReports'],
    ['Data sharing with third parties', 'sharing'],
  ])(
    'saves %s with its date and wording, and leaves the others alone',
    async (label, purpose) => {
      await renderWithSettings(<DataPrivacySettings />);

      fireEvent.click(screen.getByRole('switch', { name: label }));
      saveTab();

      const { privacy } = currentSettings();
      expect(privacy[purpose].granted).toBe(true);
      expect(Number.isNaN(Date.parse(privacy[purpose].updatedAt))).toBe(false);
      expect(privacy[purpose].version).toBe(
        PRIVACY_POLICY_VERSIONS[
          purpose as keyof typeof PRIVACY_POLICY_VERSIONS
        ],
      );
      for (const other of ['analytics', 'errorReports', 'sharing']) {
        if (other !== purpose) expect(privacy[other].granted).toBe(false);
      }
      expect(checked(label)).toBe('true');
    },
  );

  it('reads choices saved by an earlier version', async () => {
    localStorage.setItem(
      'synapcity-preferences',
      JSON.stringify({ privacy: { dataSharing: true, tracking: true } }),
    );
    await renderWithSettings(<DataPrivacySettings />);

    expect(checked('Activity tracking')).toBe('true');
    expect(checked('Data sharing with third parties')).toBe('true');
    expect(checked('Error reports')).toBe('false');
  });

  it('asks again when the saved choices were made under other wording', async () => {
    localStorage.setItem(
      'synapcity-preferences',
      JSON.stringify({
        privacy: {
          analytics: {
            granted: true,
            updatedAt: null,
            version: PRIVACY_POLICY_VERSIONS.analytics + 1,
          },
          sharing: {
            granted: true,
            updatedAt: null,
            version: PRIVACY_POLICY_VERSIONS.sharing,
          },
        },
      }),
    );
    await renderWithSettings(<DataPrivacySettings />);

    expect(checked('Activity tracking')).toBe('false');
    // Only the purpose whose wording changed is asked again, and it says so.
    expect(checked('Data sharing with third parties')).toBe('true');
    expect(
      screen.getByText(/What Activity tracking covers has changed/),
    ).toBeTruthy();
  });

  it('stops asking once the person chooses again', async () => {
    localStorage.setItem(
      'synapcity-preferences',
      JSON.stringify({
        privacy: {
          analytics: {
            granted: true,
            updatedAt: null,
            version: PRIVACY_POLICY_VERSIONS.analytics + 1,
          },
        },
      }),
    );
    await renderWithSettings(<DataPrivacySettings />);

    fireEvent.click(screen.getByRole('switch', { name: 'Activity tracking' }));
    saveTab();

    expect(screen.queryByText(/has changed/)).toBeNull();
    expect(currentSettings().privacy.analytics.askAgain).toBe(false);
  });

  describe('with Global Privacy Control', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'globalPrivacyControl', {
        value: true,
        configurable: true,
      });
      localStorage.setItem(
        'synapcity-preferences',
        JSON.stringify({ privacy: { dataSharing: true, tracking: true } }),
      );
    });

    it('keeps sharing off and says why, without changing the saved choice', async () => {
      await renderWithSettings(<DataPrivacySettings />);

      expect(checked('Data sharing with third parties')).toBe('false');
      expect(screen.getByText(/sends Global Privacy Control/)).toBeTruthy();
      expect(currentSettings().privacy.sharing.granted).toBe(true);
    });

    it('leaves the other purposes to the saved choice', async () => {
      await renderWithSettings(<DataPrivacySettings />);

      expect(checked('Activity tracking')).toBe('true');
      fireEvent.click(screen.getByRole('switch', { name: 'Error reports' }));
      saveTab();
      expect(currentSettings().privacy.errorReports.granted).toBe(true);
    });
  });
});
