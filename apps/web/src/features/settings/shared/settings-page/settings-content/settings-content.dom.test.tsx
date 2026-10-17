import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ModeProvider } from '@synapcity/frontend-ui/providers/mode-provider';

import { stubBrowser } from '../../../test-harness';
import tabs from '../../../lib/data/tabs';
import { SettingsContent } from '../settings-content';

beforeEach(() => {
  stubBrowser();
  window.location.hash = '';
});
afterEach(() => vi.unstubAllGlobals());

const show = (name?: string | null) =>
  render(
    <ModeProvider attribute="class" defaultTheme="system" enableSystem>
      <SettingsContent name={name} />
    </ModeProvider>,
  );

describe('SettingsContent', () => {
  it('assembles the header, the category tabs and the footer', async () => {
    show('Ada');

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Settings',
    );
    expect(screen.getByText(/Welcome, Ada\./)).toBeTruthy();
    expect(
      screen.getByRole('tablist', { name: 'Settings categories' }),
    ).toBeTruthy();
    expect(screen.getAllByRole('tab')).toHaveLength(tabs.length);
    expect(screen.getByRole('contentinfo')).toBeTruthy();
  });

  // A page titled with another tab's name sends people looking in the wrong
  // place (the Theme page was once titled "Appearance" beside an Appearance tab).
  // Account is left out: it reads the signed-in user and server actions, which
  // its own tests mock, and this layout test does not.
  it.each(
    tabs
      .filter((tab) => tab.value !== 'account')
      .map((tab) => [tab.label, tab.value]),
  )('titles the %s page without naming another tab', async (label, value) => {
    window.location.hash = value;
    show();
    // Only the open panel: tabs opened earlier stay mounted, hidden.
    const panel = await screen.findByRole('tabpanel', {}, { timeout: 5000 });
    const title = await waitFor(
      () => {
        const node = panel.querySelector('[data-slot="card-title"]');
        if (!node?.textContent) throw new Error('title not loaded');
        return node.textContent;
      },
      { timeout: 5000 },
    );
    const otherLabels = tabs
      .map((tab) => tab.label)
      .filter((other) => other !== label);
    expect(otherLabels).not.toContain(title);
  });

  it('keeps unsaved Theme choices through a visit to another tab', async () => {
    show();
    const colorTheme = () =>
      screen.getByRole('combobox', { name: 'Color theme' });
    await waitFor(() => colorTheme(), { timeout: 5000 });

    fireEvent.click(colorTheme());
    const dark = await screen.findByRole('option', { name: 'Dark' });
    fireEvent.pointerDown(dark, { pointerType: 'mouse', button: 0 });
    fireEvent.click(dark, { detail: 1 });
    await waitFor(() => expect(colorTheme().textContent).toContain('Dark'));

    fireEvent.click(screen.getByRole('tab', { name: 'Display' }));
    await screen.findByRole(
      'combobox',
      { name: 'Contrast' },
      { timeout: 5000 },
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Theme' }));

    await waitFor(() => expect(colorTheme().textContent).toContain('Dark'));
    expect(
      within(screen.getByRole('tabpanel')).getByRole('status').textContent,
    ).toBe('You have unsaved changes.');
  });

  it('opens on the theme tab and loads its content', async () => {
    show();

    expect(
      screen.getByRole('tab', { name: 'Theme' }).getAttribute('aria-selected'),
    ).toBe('true');
    expect(
      await screen.findByRole(
        'combobox',
        { name: 'Color theme' },
        { timeout: 5000 },
      ),
    ).toBeTruthy();
  });
});
