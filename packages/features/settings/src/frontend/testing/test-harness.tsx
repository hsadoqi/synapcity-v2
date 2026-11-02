import type { ReactNode } from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  type RenderResult,
} from '@testing-library/react';
import { expect, vi } from 'vitest';
import {
  ModeProvider,
  PreferencesProvider,
  type SaveAccountPreferences,
} from '@synapcity/frontend-preferences';
import type { PreferencesSession } from '@synapcity/domain-preferences';

import { useSettings } from '../hooks/use-settings-lifecycle/use-settings';
import { SettingsProvider } from '../providers/settings-provider';

/** jsdom has no ResizeObserver or getAnimations, which the providers and Base UI read. */
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

const guest: PreferencesSession = { kind: 'guest' };

/** The root providers a host mounts, around the Settings page's own provider. */
export function SettingsTestProviders({
  children,
  session = guest,
  save,
  name,
  draftScope,
}: {
  children: ReactNode;
  session?: PreferencesSession;
  save?: SaveAccountPreferences;
  name?: string | null;
  draftScope?: string;
}) {
  return (
    <ModeProvider attribute="class" defaultTheme="system" enableSystem>
      <PreferencesProvider session={session} saveAccountPreferences={save}>
        <SettingsProvider name={name} draftScope={draftScope}>
          {children}
        </SettingsProvider>
      </PreferencesProvider>
    </ModeProvider>
  );
}

/** Mounts `ui` inside the real providers and waits until stored settings load. */
export async function renderWithSettings(
  ui: ReactNode,
  options: {
    draftScope?: string;
    session?: PreferencesSession;
    save?: SaveAccountPreferences;
  } = {},
): Promise<RenderResult> {
  const result = render(
    <SettingsTestProviders {...options}>
      {ui}
      <ReadSettings />
    </SettingsTestProviders>,
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
