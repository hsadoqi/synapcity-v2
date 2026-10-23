import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PREFERENCES_STORAGE_KEY } from '../../../shared/appearance-attributes';
import { fontBootScript } from '../../../shared/font-preferences';
import { renderWithSettings, stubBrowser } from '../../../test-harness';

beforeEach(stubBrowser);
afterEach(() => vi.unstubAllGlobals());

// The root layout's boot scripts apply saved choices before first paint. The
// provider mounts later with the defaults and only then restores what is saved;
// it must not undo the boot scripts in between.
describe('SettingsProvider after the boot scripts', () => {
  it('keeps the saved fonts on <html> while it restores them', async () => {
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ theme: { mode: 'light', headingFont: 'lora' } }),
    );
    new Function(fontBootScript)();
    const style = document.documentElement.style;
    const removed = vi.spyOn(style, 'removeProperty');

    await renderWithSettings(<span>settings</span>);

    expect(removed).not.toHaveBeenCalledWith('--font-preference-heading');
    expect(style.getPropertyValue('--font-preference-heading')).toBe(
      "'Lora', serif",
    );
    expect(
      JSON.parse(screen.getByTestId('settings').textContent!).theme,
    ).toMatchObject({
      headingFont: 'lora',
    });
  });

  it('keeps the saved appearance attributes while it restores them', async () => {
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ appearance: { contrastMode: 'high' } }),
    );
    document.documentElement.dataset.contrast = 'high';
    const seen: (string | undefined)[] = [];
    const observer = new MutationObserver(() =>
      seen.push(document.documentElement.dataset.contrast),
    );
    observer.observe(document.documentElement, { attributes: true });

    await renderWithSettings(<span>settings</span>);
    seen.push(
      ...observer
        .takeRecords()
        .map(() => document.documentElement.dataset.contrast),
    );
    observer.disconnect();

    expect(seen).not.toContain('none');
    expect(document.documentElement.dataset.contrast).toBe('high');
  });
});
