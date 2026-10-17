import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ModeProvider } from '@synapcity/frontend-ui/providers/mode-provider';

import { stubBrowser } from '../../../test-harness';
import { SettingsProvider } from '../../../providers/settings-provider';
import { SettingsHeader } from '../settings-header';

beforeEach(stubBrowser);
afterEach(() => vi.unstubAllGlobals());

const show = (name?: string | null) =>
  render(
    <ModeProvider attribute="class" defaultTheme="system" enableSystem>
      <SettingsProvider name={name}>
        <SettingsHeader />
      </SettingsProvider>
    </ModeProvider>,
  );

describe('SettingsHeader', () => {
  it('is the page’s one h1', () => {
    show();

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Settings',
    );
  });

  it('welcomes the person by name', () => {
    show('Ada');

    expect(screen.getByText(/Welcome, Ada\./)).toBeTruthy();
  });

  it('welcomes without a name when there is none', () => {
    show(null);

    expect(
      screen.getByText(/^Welcome\. This is your personal space/),
    ).toBeTruthy();
  });

  it('has a status region for save feedback', async () => {
    show();

    await waitFor(() => expect(screen.getByRole('status')).toBeTruthy());
  });
});
