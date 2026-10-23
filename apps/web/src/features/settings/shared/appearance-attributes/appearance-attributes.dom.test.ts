import { beforeEach, describe, expect, it } from 'vitest';

import { appearanceDefaults } from '../../types/appearance';
import {
  appearanceBootScript,
  applyAppearance,
  PREFERENCES_STORAGE_KEY,
} from './appearance-attributes';

const dataset = () => ({ ...document.documentElement.dataset });

beforeEach(() => {
  localStorage.clear();
  for (const key of Object.keys(document.documentElement.dataset)) {
    delete document.documentElement.dataset[key];
  }
});

function boot(saved?: string) {
  if (saved !== undefined) localStorage.setItem(PREFERENCES_STORAGE_KEY, saved);
  // The script is the string the layout inlines; run it as the browser would.
  new Function(appearanceBootScript)();
}

describe('applyAppearance', () => {
  it('writes one attribute per appearance field', () => {
    applyAppearance(document.documentElement, {
      animationsEnabled: false,
      showBorders: true,
      reducedMotion: true,
      contrastMode: 'high',
    });
    expect(dataset()).toEqual({
      animations: 'false',
      borders: 'true',
      reducedMotion: 'true',
      contrast: 'high',
    });
  });
});

describe('appearanceBootScript', () => {
  it('writes the defaults when nothing is saved', () => {
    boot();
    applyAppearance(document.documentElement, appearanceDefaults);
    const expected = dataset();
    for (const key of Object.keys(expected)) {
      delete document.documentElement.dataset[key];
    }
    boot();
    expect(dataset()).toEqual(expected);
  });

  it('writes the same attributes the provider would for saved choices', () => {
    const saved = {
      animationsEnabled: false,
      showBorders: true,
      reducedMotion: true,
      contrastMode: 'low',
      fontSize: 'small',
    } as const;
    boot(JSON.stringify({ appearance: saved }));
    const fromScript = dataset();

    applyAppearance(document.documentElement, {
      ...appearanceDefaults,
      ...saved,
    });
    expect(fromScript).toEqual(dataset());
  });

  it('falls back per field when a saved value is missing or not allowed', () => {
    boot(
      JSON.stringify({
        appearance: {
          showBorders: true,
          fontSize: 'huge',
          contrastMode: '"><script>',
          reducedMotion: 'yes',
        },
      }),
    );
    expect(dataset()).toEqual({
      animations: 'true',
      borders: 'true',
      reducedMotion: 'false',
      contrast: 'none',
      fontSize: 'medium',
    });
  });

  it.each(['{invalid', 'null', '[]', '"text"', '{"appearance":5}'])(
    'never throws on unusable storage: %s',
    (saved) => {
      expect(() => boot(saved)).not.toThrow();
      expect(dataset().fontSize).toBe('medium');
    },
  );
});
