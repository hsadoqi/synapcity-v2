import { Blob as NodeBlob, File as NodeFile } from 'node:buffer';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ModeProvider } from '@synapcity/frontend-ui/providers/mode-provider';

import { ImportExportSettings } from './index';
import {
  SettingsContext,
  SettingsProvider,
} from '../../providers/settings-provider/settings-provider';
import { useSettings } from '../../hooks/use-settings';
import { settingsDefaults, type Settings } from '../../types/settings';
import { toTransferFile } from '../../lib/scope';
import { parseImport } from '../../lib/settings';
import { transferSchema } from '../../types/import-export';
import { download } from '../../utils/download';
import { importFile } from '../../utils/import';

const objectUrls = {
  create: vi.fn((_blob: Blob) => 'blob:settings-download'),
  revoke: vi.fn(),
};

beforeEach(() => {
  localStorage.clear();
  objectUrls.create.mockClear();
  objectUrls.revoke.mockClear();
  // jsdom does not implement browser downloads. Keep real blob contents and
  // replace only the object-URL/navigation boundaries.
  vi.stubGlobal('Blob', NodeBlob);
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL = objectUrls.create;
      static revokeObjectURL = objectUrls.revoke;
    },
  );
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

afterEach(() => {
  if (vi.isFakeTimers()) vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('settings transfer utilities', () => {
  it('downloads validated JSON with the existing filename and releases resources', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-17T12:00:00Z'));
    const value = {
      ...settingsDefaults,
      account: { email: '', name: '', password: 'never-export-this' },
    };
    let clicked: HTMLAnchorElement | undefined;
    vi.mocked(HTMLAnchorElement.prototype.click).mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked = this;
      expect(document.body.contains(this)).toBe(true);
    });

    expect(download(value).type).toBe('success');
    expect(clicked?.download).toBe('synapcity-preferences-2026-10-17.json');
    expect(clicked?.href).toBe('blob:settings-download');
    expect(document.body.contains(clicked!)).toBe(false);
    const blob = objectUrls.create.mock.calls[0]![0] as unknown as NodeBlob;
    expect(blob.type).toBe('application/json');
    expect(JSON.parse(await blob.text())).toEqual(
      toTransferFile(transferSchema.parse(settingsDefaults)),
    );
    expect(await blob.text()).not.toContain('never-export-this');
    expect(objectUrls.revoke).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(objectUrls.revoke).toHaveBeenCalledExactlyOnceWith(
      'blob:settings-download',
    );
  });

  it('imports its own version 2 export back to the same settings', async () => {
    const exported: Settings = {
      ...settingsDefaults,
      regional: { ...settingsDefaults.regional, language: 'ja' },
      theme: { ...settingsDefaults.theme, mode: 'dark', bodyFont: 'lora' },
      appearance: {
        ...settingsDefaults.appearance,
        colorScheme: 'dark',
        fontSize: 'large',
      },
    };
    download(exported);
    const blob = objectUrls.create.mock.calls[0]![0] as unknown as NodeBlob;
    const contents = await blob.text();
    expect(JSON.parse(contents)).toMatchObject({
      version: 2,
      account: { regional: { language: 'ja' }, theme: { bodyFont: 'lora' } },
      device: { theme: { mode: 'dark' }, appearance: { fontSize: 'large' } },
    });
    const result = await importFile(
      new NodeFile([contents], 'prefs.json') as unknown as File,
    );
    expect(result.type).toBe('success');
    if (result.type !== 'success') return;
    expect(parseImport(result.patch).settings).toEqual(exported);
  });

  it('reports export validation errors before creating a download', () => {
    const value = {
      ...settingsDefaults,
      regional: { ...settingsDefaults.regional, timezone: 'Invalid/Zone' },
    };
    expect(download(value)).toEqual({
      type: 'error',
      message: 'We couldn’t export your preferences. Please try again.',
    });
    expect(objectUrls.create).not.toHaveBeenCalled();
  });

  it('cleans up the anchor and URL even if starting the download fails', () => {
    vi.useFakeTimers();
    vi.mocked(HTMLAnchorElement.prototype.click).mockImplementation(() => {
      throw new Error('download blocked');
    });
    expect(download(settingsDefaults).type).toBe('error');
    expect(document.querySelector('a[download]')).toBeNull();
    vi.advanceTimersByTime(1000);
    expect(objectUrls.revoke).toHaveBeenCalledExactlyOnceWith(
      'blob:settings-download',
    );
  });

  it('returns only accepted fields without filling absent preferences with defaults', async () => {
    const result = await importFile(
      new NodeFile(['{"regional":{"language":"fr"}}'], 'prefs.JSON'),
    );
    expect(result.type).toBe('success');
    if (result.type !== 'success') throw new Error(result.message);
    expect(result.patch).toEqual({ regional: { language: 'fr' } });
    expect(result.message).toBe('Preferences imported. You’re all set.');
  });

  it('reports ignored keys while importing valid preferences', async () => {
    const result = await importFile(
      new NodeFile(
        [
          '{"regional":{"language":"fr","timezone":"Invalid/Zone"},"account":{"password":"secret"}}',
        ],
        'prefs.json',
      ),
    );
    expect(result.type).toBe('success');
    expect(result.message).toBe(
      'Preferences imported. Ignored keys: regional.timezone, account.',
    );
    if (result.type === 'success')
      expect(result.patch).toEqual({ regional: { language: 'fr' } });
  });

  it.each([
    [
      'a version 2 file',
      {
        version: 2,
        account: { privacy: { analytics: true }, regional: { language: 'fr' } },
      },
    ],
    [
      'a flat file',
      {
        privacy: { analytics: true, tracking: true },
        regional: { language: 'fr' },
      },
    ],
  ])('never grants or withdraws consent from %s', async (_label, contents) => {
    const result = await importFile(
      new NodeFile([JSON.stringify(contents)], 'prefs.json'),
    );
    expect(result.type).toBe('success');
    if (result.type !== 'success') return;
    expect(result.patch).toEqual({ regional: { language: 'fr' } });
    expect(result.message).toBe(
      'Preferences imported. Privacy choices aren’t imported. Review them in Data privacy.',
    );
  });

  it('reports a file with only privacy choices as having nothing to import', async () => {
    const result = await importFile(
      new NodeFile(['{"privacy":{"analytics":true}}'], 'prefs.json'),
    );
    expect(result.type).toBe('error');
  });

  it('rejects a file from a newer version instead of reading it as a flat file', async () => {
    expect(
      await importFile(
        new NodeFile(
          ['{"version":3,"account":{"regional":{"language":"fr"}}}'],
          'prefs.json',
        ),
      ),
    ).toEqual({
      type: 'error',
      message:
        'This file comes from a newer version of Synapcity. Update the app and try again.',
    });
  });

  it('rejects the wrong extension without reading the file', async () => {
    const file = new NodeFile(['{}'], 'prefs.txt');
    const read = vi.spyOn(file, 'text');
    expect(await importFile(file)).toEqual({
      type: 'error',
      message: 'Please choose a .json file.',
    });
    expect(read).not.toHaveBeenCalled();
  });

  it('rejects files larger than 1 MB without reading them', async () => {
    const file = new NodeFile([' '.repeat(1024 * 1024 + 1)], 'prefs.json');
    const read = vi.spyOn(file, 'text');
    expect(await importFile(file)).toEqual({
      type: 'error',
      message: 'Please choose a file smaller than 1 MB.',
    });
    expect(read).not.toHaveBeenCalled();
  });

  it('accepts a file exactly at the size limit', async () => {
    const contents = '{"regional":{"language":"fr"}}'.padEnd(1024 * 1024, ' ');
    expect(
      (await importFile(new NodeFile([contents], 'prefs.json'))).type,
    ).toBe('success');
  });

  it('returns an actionable error for malformed JSON', async () => {
    expect(await importFile(new NodeFile(['{invalid'], 'prefs.json'))).toEqual({
      type: 'error',
      message: 'This file isn’t valid JSON. Check the file and try again.',
    });
  });

  it.each(['[]', 'null', '{"unknown":true}'])(
    'rejects JSON without usable preferences: %s',
    async (contents) => {
      const result = await importFile(new NodeFile([contents], 'prefs.json'));
      expect(result.type).toBe('error');
      expect(Object.hasOwn(result, 'patch')).toBe(false);
    },
  );

  it('returns file-read failures as feedback', async () => {
    const file = new NodeFile(['{}'], 'prefs.json');
    vi.spyOn(file, 'text').mockRejectedValue(
      new Error('File could not be read.'),
    );
    expect(await importFile(file)).toEqual({
      type: 'error',
      message: 'File could not be read.',
    });
  });
});

function ReadSettings() {
  const { settings, isReady, updateSettings } = useSettings();
  return (
    <>
      <span data-testid="ready">{String(isReady)}</span>
      <span data-testid="settings">{JSON.stringify(settings)}</span>
      <button
        onClick={() =>
          updateSettings({
            regional: { timezone: 'Asia/Tokyo' },
            notifications: { sound: false },
          })
        }
      >
        Change other preferences
      </button>
    </>
  );
}

async function mount() {
  const view = render(
    <ModeProvider attribute="class" defaultTheme="system" enableSystem>
      <SettingsProvider>
        <ImportExportSettings />
        <ReadSettings />
      </SettingsProvider>
    </ModeProvider>,
  );
  await waitFor(() =>
    expect(screen.getByTestId('ready').textContent).toBe('true'),
  );
  return view;
}

const settings = () => JSON.parse(screen.getByTestId('settings').textContent!);

describe('ImportExportSettings with extracted utilities', () => {
  it('reports application failures and still resets the file input', async () => {
    render(
      <SettingsContext.Provider
        value={{
          settings: settingsDefaults,
          updateSettings: () => {
            throw new Error('Settings could not be applied.');
          },
          status: '',
          name: null,
          updateName: () => {},
          isReady: true,
          syncsToAccount: false,
          displayOnAllDevices: false,
          setDisplayOnAllDevices: () => {},
        }}
      >
        <ImportExportSettings />
      </SettingsContext.Provider>,
    );
    const input = screen.getByLabelText(
      'Import preferences file',
    ) as HTMLInputElement;
    Object.defineProperty(input, 'value', {
      configurable: true,
      writable: true,
      value: 'selected.json',
    });
    fireEvent.change(input, {
      target: {
        files: [new NodeFile(['{"regional":{"language":"fr"}}'], 'prefs.json')],
      },
    });
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain(
        'Settings could not be applied.',
      ),
    );
    expect(input.value).toBe('');
    expect(localStorage.getItem('synapcity-preferences')).toBeNull();
  });

  it('exports through the helper and displays its feedback', async () => {
    await mount();
    fireEvent.click(screen.getByRole('button', { name: 'Export preferences' }));
    expect(objectUrls.create).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status').textContent).toContain(
      'Your preferences have been exported.',
    );
  });

  it('applies a successful import through the real provider and resets the file input', async () => {
    localStorage.setItem(
      'synapcity-preferences',
      JSON.stringify({ regional: { timezone: 'Asia/Tokyo' } }),
    );
    await mount();
    const input = screen.getByLabelText(
      'Import preferences file',
    ) as HTMLInputElement;
    Object.defineProperty(input, 'value', {
      configurable: true,
      writable: true,
      value: 'selected.json',
    });
    fireEvent.change(input, {
      target: {
        files: [new NodeFile(['{"regional":{"language":"fr"}}'], 'prefs.json')],
      },
    });
    await waitFor(() => expect(settings().regional.language).toBe('fr'));
    expect(settings().regional.timezone).toBe('Asia/Tokyo');
    expect(
      JSON.parse(localStorage.getItem('synapcity-preferences')!).regional
        .language,
    ).toBe('fr');
    expect(input.value).toBe('');
    expect(screen.getByRole('status').textContent).toContain(
      'Preferences imported.',
    );
  });

  it('leaves settings unchanged on failure and supports retrying the same file', async () => {
    await mount();
    const initial = settings();
    const input = screen.getByLabelText(
      'Import preferences file',
    ) as HTMLInputElement;
    const file = new NodeFile(['{invalid'], 'prefs.json');
    const read = vi.spyOn(file, 'text');
    Object.defineProperty(input, 'value', {
      configurable: true,
      writable: true,
      value: 'selected.json',
    });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain(
        'This file isn’t valid JSON.',
      ),
    );
    expect(settings()).toEqual(initial);
    expect(localStorage.getItem('synapcity-preferences')).toBeNull();
    expect(input.value).toBe('');
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(read).toHaveBeenCalledTimes(2));
  });

  it('merges into the latest settings after a delayed file read and blocks duplicate imports', async () => {
    await mount();
    let finishRead!: (contents: string) => void;
    const file = new NodeFile([''], 'prefs.json');
    const read = vi.spyOn(file, 'text').mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          finishRead = resolve;
        }),
    );
    const input = screen.getByLabelText(
      'Import preferences file',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    expect(
      screen
        .getByRole('button', { name: 'Import preferences' })
        .getAttribute('aria-busy'),
    ).toBe('true');
    expect(input.disabled).toBe(true);
    expect(
      (
        screen.getByRole('button', {
          name: 'Export preferences',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      (
        screen.getByRole('button', {
          name: 'Reset to defaults',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    fireEvent.change(input, { target: { files: [file] } });
    expect(read).toHaveBeenCalledTimes(1);

    fireEvent.click(
      screen.getByRole('button', { name: 'Change other preferences' }),
    );
    await act(async () => {
      finishRead('{"regional":{"language":"fr"}}');
    });
    expect(settings().regional).toMatchObject({
      language: 'fr',
      timezone: 'Asia/Tokyo',
    });
    expect(settings().notifications.sound).toBe(false);
    expect(
      JSON.parse(localStorage.getItem('synapcity-preferences')!).notifications
        .sound,
    ).toBe(false);
    expect(input.disabled).toBe(false);
    expect(
      screen
        .getByRole('button', { name: 'Import preferences' })
        .getAttribute('aria-busy'),
    ).toBe('false');
  });

  it('round trips an exported file through the actual import control', async () => {
    localStorage.setItem(
      'synapcity-preferences',
      JSON.stringify({
        regional: {
          language: 'fr',
          timezone: 'Europe/Paris',
          numberFormat: '1.000,00',
        },
        appearance: { showBorders: true },
        notifications: { push: true },
        privacy: { tracking: true },
        theme: { mode: 'dark' },
      }),
    );
    const view = await mount();
    // Consent is exported but never imported: it stays at the defaults.
    const before = {
      ...transferSchema.parse(settings()),
      privacy: settingsDefaults.privacy,
    };
    expect(settings().privacy.analytics.granted).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Export preferences' }));
    const blob = objectUrls.create.mock.calls[0]![0] as unknown as NodeBlob;
    const contents = await blob.text();
    view.unmount();
    localStorage.clear();
    await mount();
    fireEvent.change(screen.getByLabelText('Import preferences file'), {
      target: { files: [new NodeFile([contents], 'export.json')] },
    });
    await waitFor(() =>
      expect(transferSchema.parse(settings())).toEqual(before),
    );
    expect(
      transferSchema.parse(
        JSON.parse(localStorage.getItem('synapcity-preferences')!),
      ),
    ).toEqual(before);
    expect(screen.getByRole('status').textContent).toContain(
      'Privacy choices aren’t imported.',
    );
  });

  it('requires confirmation to reset and restores all transferable preferences', async () => {
    await mount();
    fireEvent.click(
      screen.getByRole('button', { name: 'Change other preferences' }),
    );
    const changed = settings();
    const saved = localStorage.getItem('synapcity-preferences');
    fireEvent.click(screen.getByRole('button', { name: 'Reset to defaults' }));
    let dialog = await screen.findByRole('alertdialog');
    expect(settings()).toEqual(changed);
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Keep my settings' }),
    );
    expect(localStorage.getItem('synapcity-preferences')).toBe(saved);
    fireEvent.click(screen.getByRole('button', { name: 'Reset to defaults' }));
    dialog = await screen.findByRole('alertdialog');
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Reset preferences' }),
    );
    expect(transferSchema.parse(settings())).toEqual(
      transferSchema.parse(settingsDefaults),
    );
    expect(screen.getByRole('status').textContent).toContain(
      'Your preferences are back to their defaults.',
    );
  });

  it('clears success feedback after three seconds and lets errors remain until dismissed', async () => {
    await mount();
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: 'Export preferences' }));
    expect(screen.getByRole('status').textContent).toContain('exported');
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.queryByRole('status')).toBeNull();

    objectUrls.create.mockImplementationOnce(() => {
      throw new Error('download unavailable');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Export preferences' }));
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });
    expect(screen.getByRole('alert').textContent).toContain(
      'We couldn’t export your preferences.',
    );
    expect(screen.getByRole('alert').textContent).not.toContain(
      'Couldn’t import',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('disables transfer actions until the provider has finished loading', () => {
    render(
      <SettingsContext.Provider
        value={{
          settings: settingsDefaults,
          updateSettings: vi.fn(),
          status: '',
          name: null,
          updateName: vi.fn(),
          isReady: false,
          syncsToAccount: false,
          displayOnAllDevices: false,
          setDisplayOnAllDevices: () => {},
        }}
      >
        <ImportExportSettings />
      </SettingsContext.Provider>,
    );
    for (const name of [
      'Export preferences',
      'Import preferences',
      'Reset to defaults',
    ]) {
      expect(
        (screen.getByRole('button', { name }) as HTMLButtonElement).disabled,
      ).toBe(true);
    }
    expect(objectUrls.create).not.toHaveBeenCalled();
  });
});
