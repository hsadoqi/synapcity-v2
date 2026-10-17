import { render, screen } from '@testing-library/react';
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
