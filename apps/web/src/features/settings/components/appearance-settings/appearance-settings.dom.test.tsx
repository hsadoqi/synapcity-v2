import { fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  currentSettings,
  renderWithSettings,
  stubBrowser,
} from '../../test-harness';
import { AppearanceSettings } from './index';

beforeEach(stubBrowser);
afterEach(() => vi.unstubAllGlobals());

describe('AppearanceSettings', () => {
  it('shows the display switches at their defaults', async () => {
    await renderWithSettings(<AppearanceSettings />);

    expect(
      screen
        .getByRole('switch', { name: 'Show component borders' })
        .getAttribute('aria-checked'),
    ).toBe('false');
    expect(
      screen
        .getByRole('switch', { name: 'Enable animations' })
        .getAttribute('aria-checked'),
    ).toBe('true');
  });

  it('saves borders without touching animations', async () => {
    await renderWithSettings(<AppearanceSettings />);

    fireEvent.click(
      screen.getByRole('switch', { name: 'Show component borders' }),
    );

    expect(currentSettings().appearance.showBorders).toBe(true);
    expect(currentSettings().appearance.animationsEnabled).toBe(true);
  });

  it('saves animations without touching borders', async () => {
    await renderWithSettings(<AppearanceSettings />);

    fireEvent.click(screen.getByRole('switch', { name: 'Enable animations' }));

    expect(currentSettings().appearance.animationsEnabled).toBe(false);
    expect(currentSettings().appearance.showBorders).toBe(false);
  });

  it('shows every appearance field except the color scheme the Theme tab owns', async () => {
    await renderWithSettings(<AppearanceSettings />);

    expect(
      screen
        .getByRole('switch', { name: 'Reduce motion' })
        .getAttribute('aria-checked'),
    ).toBe('false');
    expect(
      screen.getByRole('combobox', { name: 'Text size' }).textContent,
    ).toContain('Medium');
    expect(
      screen.getByRole('combobox', { name: 'Contrast' }).textContent,
    ).toContain('Standard');
    expect(screen.queryByText('Color theme')).toBeNull();
  });

  it('saves reduced motion on its own', async () => {
    await renderWithSettings(<AppearanceSettings />);

    fireEvent.click(screen.getByRole('switch', { name: 'Reduce motion' }));

    expect(currentSettings().appearance).toEqual({
      ...currentSettings().appearance,
      reducedMotion: true,
      animationsEnabled: true,
      showBorders: false,
    });
    expect(document.documentElement.dataset.reducedMotion).toBe('true');
  });
});
