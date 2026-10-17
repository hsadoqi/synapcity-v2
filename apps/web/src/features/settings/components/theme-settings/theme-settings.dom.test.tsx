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

describe('ThemeSettings', () => {
  it('shows the control, a live preview and the disclaimer', async () => {
    await renderWithSettings(<ThemeSettings />);

    expect(screen.getByRole('combobox', { name: 'Color theme' })).toBeTruthy();
    expect(screen.getByLabelText('Live workspace preview')).toBeTruthy();
    expect(
      screen.getByText(
        'Your theme will change automatically with your device.',
      ),
    ).toBeTruthy();
  });

  it('saves a chosen mode and updates the disclaimer', async () => {
    await renderWithSettings(<ThemeSettings />);

    fireEvent.click(screen.getByRole('combobox', { name: 'Color theme' }));
    const item = await screen.findByRole('option', { name: 'Dark' });
    fireEvent.pointerDown(item, { pointerType: 'mouse', button: 0 });
    fireEvent.click(item, { detail: 1 });

    await waitFor(() =>
      expect(
        screen.getByText('Your workspace is always in dark mode.'),
      ).toBeTruthy(),
    );
    expect(currentSettings().theme.mode).toBe('dark');
  });

  it('shows a font select and preview for headings, body and code', async () => {
    await renderWithSettings(<ThemeSettings />);

    for (const name of ['Heading font', 'Body font', 'Monospace font']) {
      expect(screen.getByRole('combobox', { name })).toBeTruthy();
    }
    expect(screen.getAllByRole('figure')).toHaveLength(3);
  });

  it('saves a chosen font and fetches only that family', async () => {
    await renderWithSettings(<ThemeSettings />);

    fireEvent.click(screen.getByRole('combobox', { name: 'Heading font' }));
    const item = await screen.findByRole('option', { name: 'Lora' });
    fireEvent.pointerDown(item, { pointerType: 'mouse', button: 0 });
    fireEvent.click(item, { detail: 1 });

    await waitFor(() =>
      expect(currentSettings().theme.headingFont).toBe('lora'),
    );
    expect(currentSettings().theme.bodyFont).toBe('default');
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
