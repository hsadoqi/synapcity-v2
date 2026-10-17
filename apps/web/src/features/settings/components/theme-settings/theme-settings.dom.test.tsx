import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  currentSettings,
  renderWithSettings,
  stubBrowser,
} from '../../test-harness';
import { ThemeSettings } from './index';

beforeEach(stubBrowser);
afterEach(() => vi.unstubAllGlobals());

/** Opens the named select and picks an option, the way Base UI expects. */
async function pick(select: string, option: string) {
  fireEvent.click(screen.getByRole('combobox', { name: select }));
  const item = await screen.findByRole('option', { name: option });
  fireEvent.pointerDown(item, { pointerType: 'mouse', button: 0 });
  fireEvent.click(item, { detail: 1 });
}

describe('ThemeSettings', () => {
  it('shows the control, a live preview and the disclaimer', async () => {
    await renderWithSettings(<ThemeSettings />);

    expect(screen.getByRole('combobox', { name: 'Color theme' })).toBeTruthy();
    expect(screen.getByRole('figure', { name: 'Live preview' })).toBeTruthy();
    expect(
      screen.getByText(
        'Your theme will change automatically with your device.',
      ),
    ).toBeTruthy();
  });

  it('outlines the tab as its title, then the Fonts section, and nothing else', async () => {
    await renderWithSettings(<ThemeSettings />);

    expect(
      screen.getAllByRole('heading').map((heading) => ({
        level: Number(heading.tagName.slice(1)),
        text: heading.textContent,
      })),
    ).toEqual([
      { level: 2, text: 'Theme' },
      { level: 3, text: 'Fonts' },
    ]);
  });

  it('previews a chosen mode, and switches the workspace only on save', async () => {
    await renderWithSettings(<ThemeSettings />);
    const saveButton = screen.getByRole('button', { name: 'Save changes' });
    expect(saveButton.hasAttribute('disabled')).toBe(true);

    await pick('Color theme', 'Dark');

    await waitFor(() =>
      expect(
        screen.getByText('Your workspace is always in dark mode.'),
      ).toBeTruthy(),
    );
    expect(screen.getByRole('status').textContent).toBe(
      'You have unsaved changes.',
    );
    expect(currentSettings().theme.mode).toBe('system');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    fireEvent.click(saveButton);

    await waitFor(() => expect(currentSettings().theme.mode).toBe('dark'));
    await waitFor(() =>
      expect(document.documentElement.classList.contains('dark')).toBe(true),
    );
    expect(saveButton.hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('status').textContent).toBe('');
  });

  it('has nothing to save after a choice is changed back', async () => {
    await renderWithSettings(<ThemeSettings />);

    await pick('Color theme', 'Dark');
    await waitFor(() =>
      expect(
        screen
          .getByRole('button', { name: 'Save changes' })
          .hasAttribute('disabled'),
      ).toBe(false),
    );
    await pick('Color theme', 'System default');

    await waitFor(() =>
      expect(
        screen
          .getByRole('button', { name: 'Save changes' })
          .hasAttribute('disabled'),
      ).toBe(true),
    );
  });

  it('shows a font select and preview for headings, body and code', async () => {
    await renderWithSettings(<ThemeSettings />);

    for (const name of ['Heading font', 'Body font', 'Monospace font']) {
      expect(screen.getByRole('combobox', { name })).toBeTruthy();
    }
    for (const name of [
      'Heading font preview',
      'Body font preview',
      'Code font preview',
    ]) {
      expect(screen.getByRole('figure', { name })).toBeTruthy();
    }
  });

  it('previews a chosen font, and saves only the changed field', async () => {
    await renderWithSettings(<ThemeSettings />);

    await pick('Heading font', 'Lora');

    // Fetched for the previews, but not applied to the page yet.
    await waitFor(() =>
      expect(
        document.head.querySelectorAll('link[rel="stylesheet"]'),
      ).toHaveLength(1),
    );
    expect(
      screen
        .getByRole('figure', { name: 'Heading font preview' })
        .style.getPropertyValue('--font-preference-heading'),
    ).toBe("'Lora', serif");
    expect(
      document.documentElement.style.getPropertyValue(
        '--font-preference-heading',
      ),
    ).toBe('');
    expect(currentSettings().theme.headingFont).toBe('default');

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(currentSettings().theme.headingFont).toBe('lora'),
    );
    expect(currentSettings().theme).toMatchObject({
      mode: 'system',
      bodyFont: 'default',
      codeFont: 'default',
    });
    await waitFor(() =>
      expect(
        document.documentElement.style.getPropertyValue(
          '--font-preference-heading',
        ),
      ).toBe("'Lora', serif"),
    );
    expect(
      document.head.querySelectorAll('link[rel="stylesheet"]'),
    ).toHaveLength(1);
  });
});
