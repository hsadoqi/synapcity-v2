import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ModeProvider } from '@synapcity/frontend-preferences';

import { DateFormatRow, NumberFormatRow, TimeFormatRow } from './regional-rows';
import {
  SettingsContext,
  SettingsProvider,
} from '../../providers/settings-provider/settings-provider';
import { useSettings } from '../../hooks/use-settings';
import { settingsDefaults } from '@synapcity/domain-preferences';
import type { RegionalSettings as RegionalSettingsType } from '@synapcity/domain-preferences';
import { RegionalSettings } from './index';
import { AppearanceSettings } from '../appearance-settings';

// Changes wait in the tab's draft until saved; one save writes them all.
function saveTab(title = 'Regional') {
  const card = screen
    .getByRole('heading', { level: 2, name: title })
    .closest('[data-slot="card"]') as HTMLElement;
  fireEvent.click(within(card).getByRole('button', { name: 'Save changes' }));
}

const initialRegional: RegionalSettingsType = {
  language: 'de',
  timezone: 'Asia/Tokyo',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24-hour',
  numberFormat: '1.000,00',
  firstDayOfWeek: 'monday',
};

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('lang');
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
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function ReadSettings() {
  const { settings, isReady } = useSettings();
  return (
    <>
      <span data-testid="ready">{String(isReady)}</span>
      <span data-testid="settings">{JSON.stringify(settings)}</span>
    </>
  );
}

async function mount(extra: ReactNode = null) {
  const result = render(
    <ModeProvider attribute="class" defaultTheme="system" enableSystem>
      <SettingsProvider>
        <RegionalSettings />
        {extra}
        <ReadSettings />
      </SettingsProvider>
    </ModeProvider>,
  );
  await waitFor(() =>
    expect(screen.getByTestId('ready').textContent).toBe('true'),
  );
  await waitFor(() =>
    expect(
      document.getElementById('time-description')?.textContent,
    ).not.toContain('…'),
  );
  return result;
}

const values = () => JSON.parse(screen.getByTestId('settings').textContent!);

async function choose(label: string, option: string) {
  const control = screen.getByRole('combobox', { name: label });
  if (control instanceof HTMLInputElement) {
    // The timezone list is searchable: open it, type to narrow it, then pick.
    fireEvent.keyDown(control, { key: 'ArrowDown' });
    fireEvent.change(control, { target: { value: option } });
  } else {
    fireEvent.click(control);
  }
  const item = await screen.findByRole('option', { name: option });
  fireEvent.pointerDown(item, { pointerType: 'mouse', button: 0 });
  fireEvent.click(item, { detail: 1 });
  await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
}

describe('regional controls', () => {
  it.each([
    {
      label: 'Preferred language',
      field: 'language',
      option: 'Français — French',
      value: 'fr',
    },
    {
      label: 'Timezone',
      field: 'timezone',
      option: 'America/New York',
      value: 'America/New_York',
    },
    {
      label: 'Date format',
      field: 'dateFormat',
      option: 'YYYY-MM-DD',
      value: 'YYYY-MM-DD',
    },
    {
      label: 'Time format',
      field: 'timeFormat',
      option: '12-hour',
      value: '12-hour',
    },
    {
      label: 'Number format',
      field: 'numberFormat',
      option: '1 000,00',
      value: '1 000,00',
    },
    {
      label: 'First day of the week',
      field: 'firstDayOfWeek',
      option: 'Saturday',
      value: 'saturday',
    },
  ])(
    'updates and restores $field without resetting siblings',
    async ({ label, field, option, value }) => {
      localStorage.setItem(
        'synapcity-preferences',
        JSON.stringify({ regional: initialRegional }),
      );
      const mounted = await mount();
      expect(document.querySelectorAll('[data-slot="card"]')).toHaveLength(1);
      await choose(label, option);
      saveTab();
      const expected = { ...initialRegional, [field]: value };
      expect(values().regional).toEqual(expected);
      expect(
        JSON.parse(localStorage.getItem('synapcity-preferences')!).regional,
      ).toEqual(expected);
      mounted.unmount();
      await mount();
      expect(values().regional).toEqual(expected);
    },
    // Two mounts plus a pick from the long timezone list: on a loaded machine
    // this outlasts the 5 s vitest default, so it gets the shared margin.
    30_000,
  );

  it('keeps valid saved timezone aliases selectable', async () => {
    localStorage.setItem(
      'synapcity-preferences',
      JSON.stringify({ regional: { timezone: 'US/Eastern' } }),
    );
    await mount();
    expect(
      (screen.getByRole('combobox', { name: 'Timezone' }) as HTMLInputElement)
        .value,
    ).toBe('US/Eastern');
    await choose('Timezone', 'UTC');
    saveTab();
    expect(values().regional.timezone).toBe('UTC');
  });

  it('follows the device timezone when "Device" is chosen', async () => {
    localStorage.setItem(
      'synapcity-preferences',
      JSON.stringify({ regional: initialRegional }),
    );
    await mount();
    const device = Intl.DateTimeFormat().resolvedOptions().timeZone;
    await choose('Timezone', `Device (${device.replaceAll('_', ' ')})`);
    saveTab();
    expect(values().regional.timezone).toBe('system');
    expect(
      JSON.parse(localStorage.getItem('synapcity-preferences')!).regional
        .timezone,
    ).toBe('system');
  });

  it('reads a first day of the week saved with a capital letter', async () => {
    localStorage.setItem(
      'synapcity-preferences',
      JSON.stringify({ regional: { firstDayOfWeek: 'Monday' } }),
    );
    await mount();
    expect(values().regional.firstDayOfWeek).toBe('monday');
    expect(
      screen.getByRole('combobox', { name: 'First day of the week' })
        .textContent,
    ).toContain('Monday');
  });

  it('keeps the page language English while the interface is only in English', async () => {
    localStorage.setItem(
      'synapcity-preferences',
      JSON.stringify({ regional: initialRegional }),
    );
    await mount();
    // German saved, but every label is English: lang="de" would make a
    // screen reader read English in a German voice (WCAG 3.1.1).
    expect(document.documentElement.lang).toBe('en');
    await choose('Preferred language', '日本語 — Japanese');
    saveTab();
    expect(values().regional.language).toBe('ja');
    expect(document.documentElement.lang).toBe('en');
  });

  it('marks each language name with its own language', async () => {
    await mount();
    fireEvent.click(
      screen.getByRole('combobox', { name: 'Preferred language' }),
    );
    const option = await screen.findByRole('option', {
      name: '日本語 — Japanese',
    });
    expect(option.querySelector('[lang="ja"]')?.textContent).toBe('日本語');
  });

  it('keeps display controls working independently of regional settings', async () => {
    localStorage.setItem(
      'synapcity-preferences',
      JSON.stringify({ regional: initialRegional }),
    );
    // Display controls live on the Appearance tab; mount it beside Regional.
    await mount(<AppearanceSettings />);
    fireEvent.click(
      screen.getByRole('switch', { name: 'Show component borders' }),
    );
    saveTab('Display');
    expect(values().appearance.showBorders).toBe(true);
    expect(values().regional).toEqual(initialRegional);
  });
});

describe('regional previews', () => {
  it('formats the calendar date in the selected timezone across a day boundary', () => {
    const previewDate = new Date('2026-01-01T00:30:00Z');
    const component = render(
      <DateFormatRow
        value="MM/DD/YYYY"
        onChange={() => {}}
        timezone="America/New_York"
        previewDate={previewDate}
      />,
    );
    expect(screen.getByText('Today looks like: 12/31/2025')).toBeTruthy();
    component.rerender(
      <DateFormatRow
        value="YYYY-MM-DD"
        onChange={() => {}}
        timezone="Asia/Tokyo"
        previewDate={previewDate}
      />,
    );
    expect(screen.getByText('Today looks like: 2026-01-01')).toBeTruthy();
  });

  it('formats with the device timezone when the setting is "system"', () => {
    const previewDate = new Date('2026-01-01T00:30:00Z');
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
      ...new Intl.DateTimeFormat('en').resolvedOptions(),
      timeZone: 'Asia/Tokyo',
    });
    render(
      <TimeFormatRow
        value="24-hour"
        onChange={() => {}}
        timezone="system"
        language="en"
        previewDate={previewDate}
      />,
    );
    expect(screen.getByText('Current time looks like: 09:30')).toBeTruthy();
  });

  it('formats midnight correctly in 24-hour and 12-hour modes', () => {
    const previewDate = new Date('2026-01-01T05:30:00Z');
    const component = render(
      <TimeFormatRow
        value="24-hour"
        onChange={() => {}}
        timezone="America/New_York"
        language="en"
        previewDate={previewDate}
      />,
    );
    expect(screen.getByText('Current time looks like: 00:30')).toBeTruthy();
    component.rerender(
      <TimeFormatRow
        value="12-hour"
        onChange={() => {}}
        timezone="America/New_York"
        language="en"
        previewDate={previewDate}
      />,
    );
    expect(
      screen.getByText(/Current time looks like: 12:30\s?AM/),
    ).toBeTruthy();
  });

  it.each([
    ['1,000.00', '1,234,567.89'],
    ['1.000,00', '1.234.567,89'],
    // A narrow no-break space, so the number never wraps between groups.
    ['1 000,00', '1\u202f234\u202f567,89'],
    ["1'000.00", "1'234'567.89"],
    ['1,00,000.00', '12,34,567.89'],
  ] as const)('uses the selected number separators: %s', (value, preview) => {
    render(<NumberFormatRow value={value} onChange={() => {}} />);
    // Read the raw text: the default matcher folds the no-break space to " ".
    expect(
      document.getElementById('number-format-description')?.textContent,
    ).toBe(`An example number looks like: ${preview}`);
  });

  it('hydrates without timestamp mismatches when the server and client clocks differ', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-01T00:30:00Z'));
    const context = {
      settings: settingsDefaults,
      updateSettings: vi.fn(),
      status: '',
      name: null,
      updateName: vi.fn(),
      isReady: true,
      syncsToAccount: false,
      displayOnAllDevices: false,
      setDisplayOnAllDevices: () => {},
    };
    const content = (
      <SettingsContext.Provider value={context}>
        <RegionalSettings />
      </SettingsContext.Provider>
    );
    const html = renderToString(content);
    expect(html).toContain('Current time looks like: …');
    expect(html).toContain('Today looks like: …');
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    vi.setSystemTime(new Date('2026-01-02T12:00:00Z'));
    const onRecoverableError = vi.fn();
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, content, { onRecoverableError });
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
      await waitFor(() =>
        expect(
          container.querySelector('#time-description')?.textContent,
        ).not.toContain('…'),
      );
      expect(onRecoverableError).not.toHaveBeenCalled();
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  });
});
