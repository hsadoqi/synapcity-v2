import type { ReactNode } from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  type RenderResult,
} from '@testing-library/react';
import { expect, vi } from 'vitest';
import { ModeProvider } from '@synapcity/frontend-preferences';

import { useSettings } from './hooks/use-settings';
import { SettingsProvider } from './providers/settings-provider';

/** jsdom has no matchMedia, ResizeObserver or getAnimations, which the providers and Base UI read. */
export function stubBrowser() {
  localStorage.clear();
  // The Theme tab keeps its unsaved draft here.
  sessionStorage.clear();
  // Appearance attributes live on <html>, which every test in a file shares.
  for (const key of Object.keys(document.documentElement.dataset)) {
    delete document.documentElement.dataset[key];
  }
  // Chosen fonts live on <html>'s style and as <link>s in <head>, also shared.
  document.documentElement.removeAttribute('style');
  document.documentElement.removeAttribute('lang');
  document.head.innerHTML = '';
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
  if (!Element.prototype.getAnimations) {
    Element.prototype.getAnimations = () => [];
  }
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
}

function ReadSettings() {
  const { settings, isReady } = useSettings();
  return (
    <>
      <span data-testid="ready">{String(isReady)}</span>
      <span data-testid="settings">{JSON.stringify(settings)}</span>
    </>
  );
}

/** Mounts `ui` inside the real providers and waits until stored settings load. */
export async function renderWithSettings(ui: ReactNode): Promise<RenderResult> {
  const result = render(
    <ModeProvider attribute="class" defaultTheme="system" enableSystem>
      <SettingsProvider>
        {ui}
        <ReadSettings />
      </SettingsProvider>
    </ModeProvider>,
  );
  await waitFor(() =>
    expect(screen.getByTestId('ready').textContent).toBe('true'),
  );
  return result;
}

/** The settings the provider currently holds, as parsed JSON. */
export const currentSettings = () =>
  JSON.parse(screen.getByTestId('settings').textContent!);

/**
 * Saves the tab's draft. Changes wait in the draft until saved, and one save
 * writes them all; with one tab rendered, its button is the only one.
 */
export const saveTab = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
