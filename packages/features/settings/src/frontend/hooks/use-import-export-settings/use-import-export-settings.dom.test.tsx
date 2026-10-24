import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ModeProvider } from '@synapcity/frontend-preferences';

const mocks = vi.hoisted(() => ({ download: vi.fn(), importFile: vi.fn() }));

vi.mock('../utils/download', () => ({ download: mocks.download }));
vi.mock('../utils/import', () => ({ importFile: mocks.importFile }));

import { stubBrowser } from '../test-harness';
import { SettingsProvider } from '../providers/settings-provider/settings-provider';
import { settingsDefaults } from '@synapcity/domain-preferences';
import { useImportExportSettings } from './use-import-export-settings';
import { useSettings } from './use-settings';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ModeProvider attribute="class" defaultTheme="system" enableSystem>
    <SettingsProvider>{children}</SettingsProvider>
  </ModeProvider>
);

const mount = async () => {
  const hook = renderHook(
    () => ({ transfer: useImportExportSettings(), settings: useSettings() }),
    { wrapper },
  );
  await waitFor(() => expect(hook.result.current.transfer.isReady).toBe(true));
  return hook;
};

const file = new File(['{}'], 'prefs.json');

beforeEach(() => {
  stubBrowser();
  vi.clearAllMocks();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useImportExportSettings', () => {
  it('starts idle with no feedback', async () => {
    const { result } = await mount();

    expect(result.current.transfer.feedback).toBeNull();
    expect(result.current.transfer.isImporting).toBe(false);
  });

  describe('export', () => {
    it('exports the current settings and reports the outcome', async () => {
      mocks.download.mockReturnValue({ type: 'success', message: 'Exported.' });
      const { result } = await mount();

      act(() => result.current.transfer.importExport.exportSettings());

      expect(mocks.download).toHaveBeenCalledWith(
        result.current.settings.settings,
      );
      expect(result.current.transfer.feedback).toEqual({
        type: 'success',
        message: 'Exported.',
      });
    });

    it('lets a success message go after a few seconds, but not an error', async () => {
      mocks.download.mockReturnValueOnce({ type: 'success', message: 'Done.' });
      const { result } = await mount();
      vi.useFakeTimers();

      act(() => result.current.transfer.importExport.exportSettings());
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(result.current.transfer.feedback).toBeNull();

      mocks.download.mockReturnValueOnce({ type: 'error', message: 'Failed.' });
      act(() => result.current.transfer.importExport.exportSettings());
      act(() => {
        vi.advanceTimersByTime(10_000);
      });
      expect(result.current.transfer.feedback?.type).toBe('error');
    });

    it('can be dismissed', async () => {
      mocks.download.mockReturnValue({ type: 'error', message: 'Failed.' });
      const { result } = await mount();
      act(() => result.current.transfer.importExport.exportSettings());

      act(() => result.current.transfer.clearFeedback());

      expect(result.current.transfer.feedback).toBeNull();
    });
  });

  describe('import', () => {
    it('applies a valid file and says so', async () => {
      mocks.importFile.mockResolvedValue({
        type: 'success',
        message: 'Preferences imported.',
        patch: { notifications: { push: true } },
      });
      const { result } = await mount();

      await act(() =>
        result.current.transfer.importExport.importSettings(file),
      );

      expect(result.current.settings.settings.notifications.push).toBe(true);
      expect(result.current.transfer.feedback).toEqual({
        type: 'success',
        message: 'Preferences imported.',
      });
      expect(result.current.transfer.isImporting).toBe(false);
    });

    it('reports a refused file without changing anything', async () => {
      mocks.importFile.mockResolvedValue({
        type: 'error',
        message: 'Please choose a .json file.',
      });
      const { result } = await mount();
      const before = result.current.settings.settings;

      await act(() =>
        result.current.transfer.importExport.importSettings(file),
      );

      expect(result.current.settings.settings).toEqual(before);
      expect(result.current.transfer.feedback).toEqual({
        type: 'error',
        message: 'Please choose a .json file.',
      });
    });

    it('turns a thrown error into feedback and stops importing', async () => {
      mocks.importFile.mockRejectedValue(new Error('Disk on fire.'));
      const { result } = await mount();

      await act(() =>
        result.current.transfer.importExport.importSettings(file),
      );

      expect(result.current.transfer.feedback).toEqual({
        type: 'error',
        message: 'Disk on fire.',
      });
      expect(result.current.transfer.isImporting).toBe(false);
    });

    it('uses a generic message for something that is not an Error', async () => {
      mocks.importFile.mockRejectedValue('nope');
      const { result } = await mount();

      await act(() =>
        result.current.transfer.importExport.importSettings(file),
      );

      expect(result.current.transfer.feedback?.message).toBe(
        'Unable to apply imported preferences.',
      );
    });

    it('ignores a second import while one is running', async () => {
      let finish!: (value: unknown) => void;
      mocks.importFile.mockReturnValue(
        new Promise((resolve) => {
          finish = resolve;
        }),
      );
      const { result } = await mount();

      let first!: Promise<void>;
      act(() => {
        first = result.current.transfer.importExport.importSettings(file);
      });
      await act(() =>
        result.current.transfer.importExport.importSettings(file),
      );

      expect(mocks.importFile).toHaveBeenCalledTimes(1);
      expect(result.current.transfer.isImporting).toBe(true);

      await act(async () => {
        finish({ type: 'error', message: 'x' });
        await first;
      });
    });
  });

  describe('reset', () => {
    it('resets only the shared look and preserves unrelated preferences', async () => {
      const { result } = await mount();
      act(() =>
        result.current.settings.updateSettings({
          regional: { language: 'fr' },
          notifications: { push: true },
          privacy: {
            analytics: {
              granted: true,
              updatedAt: null,
              version: 1,
              askAgain: false,
            },
          },
          theme: { mode: 'dark', density: 'compact' },
          appearance: { contrastMode: 'high', showBorders: true },
        }),
      );

      act(() => result.current.transfer.importExport.resetSharedLook());

      expect(result.current.settings.settings.theme).toEqual(
        settingsDefaults.theme,
      );
      expect(result.current.settings.settings.appearance).toEqual(
        settingsDefaults.appearance,
      );
      expect(result.current.settings.settings.regional.language).toBe('fr');
      expect(result.current.settings.settings.notifications.push).toBe(true);
      expect(result.current.settings.settings.privacy.analytics.granted).toBe(
        true,
      );
      expect(result.current.transfer.feedback).toEqual({
        type: 'success',
        message: 'Your shared look is back to its defaults.',
      });
    });

    it('restores the defaults and says so', async () => {
      const { result } = await mount();
      act(() =>
        result.current.settings.updateSettings({
          notifications: { push: true },
        }),
      );
      expect(result.current.settings.settings.notifications.push).toBe(true);

      act(() => result.current.transfer.importExport.resetSettings());

      expect(result.current.settings.settings.notifications).toEqual(
        settingsDefaults.notifications,
      );
      expect(result.current.transfer.feedback).toEqual({
        type: 'success',
        message: 'Your preferences are back to their defaults.',
      });
    });
  });
});
