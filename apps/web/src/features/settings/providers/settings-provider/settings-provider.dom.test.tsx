import { StrictMode } from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ModeProvider,
  useMode,
} from '@synapcity/frontend-ui/providers/mode-provider';
import { SettingsProvider } from '../settings-provider';
import { useSettings } from '../../hooks/use-settings';
import { useRegionalSettings } from '../../hooks/use-regional-settings';
import { useAppearanceSettings } from '../../hooks/use-appearance-settings';
import { useNotificationSettings } from '../../hooks/use-notification-settings';
import { useDataPrivacySettings } from '../../hooks/use-data-privacy-settings';
import { useThemeSettings } from '../../hooks/use-theme-settings';
import { SettingsHeader } from '../../shared/settings-page/settings-header/settings-header';

const KEY = 'synapcity-preferences';

function Controls() {
  const { settings, updateSettings, isReady, updateName } = useSettings();
  const { updateRegional } = useRegionalSettings();
  const { updateAppearance } = useAppearanceSettings();
  const { updateNotifications } = useNotificationSettings();
  const { updatePrivacy } = useDataPrivacySettings();
  const { updateTheme } = useThemeSettings();
  const { setMode } = useMode();
  return (
    <>
      <span data-testid="ready">{String(isReady)}</span>
      <span data-testid="settings">{JSON.stringify(settings)}</span>
      <button onClick={() => updateRegional({ timezone: 'Asia/Tokyo' })}>
        Change timezone
      </button>
      <button onClick={() => updateRegional({ language: 'fr' })}>
        Change language
      </button>
      <button
        onClick={() => {
          updateTheme({ mode: 'dark' });
          updateRegional({ language: 'de' });
          updateNotifications({ email: false });
        }}
      >
        Batched updates
      </button>
      <button
        onClick={() =>
          updateAppearance({
            showBorders: true,
            animationsEnabled: false,
            reducedMotion: true,
            contrastMode: 'high',
            fontSize: 'large',
          })
        }
      >
        Change appearance
      </button>
      <button onClick={() => updatePrivacy({ tracking: true })}>
        Change privacy
      </button>
      <button onClick={() => updateTheme({ mode: 'dark' })}>Dark mode</button>
      <button onClick={() => setMode('light')}>External light mode</button>
      <button onClick={() => updateName('Grace')}>Change draft name</button>
      <button
        onClick={() =>
          updateSettings({ regional: { timezone: 'Invalid/Zone' } })
        }
      >
        Invalid update
      </button>
    </>
  );
}

function mount() {
  return render(
    <StrictMode>
      <ModeProvider attribute="class" defaultTheme="system" enableSystem>
        <SettingsProvider name="Ada">
          <SettingsHeader />
          <Controls />
        </SettingsProvider>
      </ModeProvider>
    </StrictMode>,
  );
}

const values = () => JSON.parse(screen.getByTestId('settings').textContent!);
const ready = () =>
  waitFor(() => expect(screen.getByTestId('ready').textContent).toBe('true'));

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
});

describe('shared SettingsProvider', () => {
  it('shares updates and save status across consumers and saves once per action', async () => {
    const write = vi.spyOn(Storage.prototype, 'setItem');
    mount();
    await ready();
    fireEvent.click(screen.getByText('Change timezone'));
    fireEvent.click(screen.getByText('Change language'));
    expect(values().regional).toMatchObject({
      timezone: 'Asia/Tokyo',
      language: 'fr',
    });
    expect(screen.getByRole('status').textContent).toBe('Saved');
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(values());
    expect(write.mock.calls.filter(([key]) => key === KEY)).toHaveLength(2);
  });

  it('merges rapid updates from different section hooks without losing either change', async () => {
    mount();
    await ready();
    fireEvent.click(screen.getByText('Batched updates'));
    expect(values().regional.language).toBe('de');
    expect(values().theme.mode).toBe('dark');
    expect(JSON.parse(localStorage.getItem(KEY)!).theme.mode).toBe('dark');
    expect(values().notifications).toEqual({
      email: false,
      push: false,
      sound: true,
    });
  });

  it('restores old saved preferences without rewriting them on mount', async () => {
    const saved = JSON.stringify({
      language: 'fr',
      showBorders: true,
      notifications: { sound: false },
    });
    localStorage.setItem(KEY, saved);
    mount();
    await ready();
    expect(values().regional.language).toBe('fr');
    expect(values().notifications.sound).toBe(false);
    expect(document.documentElement.dataset.borders).toBe('true');
    expect(localStorage.getItem(KEY)).toBe(saved);
    expect(screen.getByRole('status').textContent).toBe('');
  });

  it('applies appearance and privacy patches through the same owner', async () => {
    mount();
    await ready();
    fireEvent.click(screen.getByText('Change appearance'));
    fireEvent.click(screen.getByText('Change privacy'));
    expect(document.documentElement.dataset.animations).toBe('false');
    expect(document.documentElement.dataset.borders).toBe('true');
    expect(document.documentElement.dataset.reducedMotion).toBe('true');
    expect(document.documentElement.dataset.contrast).toBe('high');
    expect(document.documentElement.dataset.fontSize).toBe('large');
    expect(values().privacy).toEqual({ dataSharing: false, tracking: true });
  });

  it('uses the root mode provider and observes changes made by other mode controls', async () => {
    mount();
    await ready();
    fireEvent.click(screen.getByText('Dark mode'));
    await waitFor(() =>
      expect(document.documentElement.classList.contains('dark')).toBe(true),
    );
    expect(values().theme.mode).toBe('dark');
    fireEvent.click(screen.getByText('External light mode'));
    await waitFor(() => expect(values().theme.mode).toBe('light'));
    fireEvent.click(screen.getByText('Change language'));
    expect(JSON.parse(localStorage.getItem(KEY)!).theme.mode).toBe('light');
  });

  it('reports malformed saved data without overwriting it', async () => {
    localStorage.setItem(KEY, '{invalid');
    mount();
    await ready();
    expect(screen.getByRole('status').textContent).toContain(
      'could not be loaded',
    );
    expect(values().regional.language).toBe('en');
    expect(localStorage.getItem(KEY)).toBe('{invalid');
  });

  it('keeps changes in memory and reports storage write failures', async () => {
    mount();
    await ready();
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key,
      value,
    ) {
      if (key === KEY) throw new Error('quota exceeded');
      return original.call(this, key, value);
    });
    fireEvent.click(screen.getByText('Change language'));
    expect(values().regional.language).toBe('fr');
    expect(screen.getByRole('status').textContent).toContain(
      'Browser storage is unavailable',
    );
  });

  it('reports unavailable storage on load and still accepts session changes', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    mount();
    await ready();
    expect(screen.getByRole('status').textContent).toContain(
      'Storage unavailable',
    );
    fireEvent.click(screen.getByText('Change language'));
    expect(values().regional.language).toBe('fr');
  });

  it('rejects invalid updates and keeps identity drafts out of persisted preferences', async () => {
    mount();
    await ready();
    fireEvent.click(screen.getByText('Change draft name'));
    expect(screen.getByText(/Welcome, Grace/)).toBeTruthy();
    expect(localStorage.getItem(KEY)).toBeNull();
    fireEvent.click(screen.getByText('Invalid update'));
    expect(values().regional.timezone).toBe('system');
    expect(screen.getByRole('status').textContent).toContain(
      'could not be updated',
    );
    fireEvent.click(screen.getByText('Change language'));
    expect(localStorage.getItem(KEY)).not.toContain('Grace');
    expect(localStorage.getItem(KEY)).not.toContain('password');
  });

  it('clears the shared success status after its timeout', async () => {
    mount();
    await ready();
    vi.useFakeTimers();
    try {
      fireEvent.click(screen.getByText('Change language'));
      expect(screen.getByRole('status').textContent).toBe('Saved');
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.getByRole('status').textContent).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });
});
