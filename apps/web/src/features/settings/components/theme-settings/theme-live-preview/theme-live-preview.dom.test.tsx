import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { stubBrowser } from '../../../test-harness';
import {
  themeDefaults,
  type ThemeSettings,
} from '@synapcity/domain-preferences';
import { ThemeLivePreview } from '../theme-live-preview';

beforeEach(stubBrowser);
afterEach(() => vi.unstubAllGlobals());

const show = (theme: Partial<ThemeSettings> = {}) =>
  render(<ThemeLivePreview theme={{ ...themeDefaults, ...theme }} />);

const preview = () => screen.getByRole('figure', { name: 'Live preview' });
/** The sample workspace inside the figure, which carries the draft theme. */
const frame = () => preview().querySelector('[aria-hidden]') as HTMLElement;

describe('ThemeLivePreview', () => {
  it('is one figure, named by its visible caption', () => {
    show();

    expect(preview()).toBeTruthy();
    expect(screen.getByText('Live preview').tagName).toBe('FIGCAPTION');
  });

  it.each(['light', 'dark'] as const)(
    'shows the %s mode on the sample only, before it is saved',
    (mode) => {
      show({ mode });

      expect(frame().classList.contains(mode)).toBe(true);
      expect(document.documentElement.classList.contains(mode)).toBe(false);
    },
  );

  it('resolves system mode against the device', () => {
    // stubBrowser's matchMedia matches nothing: a device that asks for light.
    show({ mode: 'system' });

    expect(frame().classList.contains('light')).toBe(true);
    expect(frame().classList.contains('system')).toBe(false);
  });

  it('sets the chosen fonts on the sample, and resets the defaults', () => {
    show({ headingFont: 'lora', codeFont: 'fira-code' });

    expect(frame().style.getPropertyValue('--font-preference-heading')).toBe(
      "'Lora', serif",
    );
    expect(frame().style.getPropertyValue('--font-preference-code')).toBe(
      "'Fira Code', monospace",
    );
    // `initial` overrides a saved font on <html>, so the shipped one shows.
    expect(frame().style.getPropertyValue('--font-preference-body')).toBe(
      'initial',
    );
    expect(
      document.documentElement.style.getPropertyValue(
        '--font-preference-heading',
      ),
    ).toBe('');
  });

  it('fetches a chosen family so the preview can show it', () => {
    show({ headingFont: 'lora' });

    const links = document.head.querySelectorAll('link[rel="stylesheet"]');
    expect(links).toHaveLength(1);
    expect(links[0]?.getAttribute('href')).toContain('family=Lora');
  });

  it('keeps the sample content out of the accessibility tree and the outline', () => {
    show();

    expect(screen.queryByRole('heading')).toBeNull();
    expect(
      screen.getByText('A little room to think.').closest('[aria-hidden]'),
    ).toBeTruthy();
  });
});
