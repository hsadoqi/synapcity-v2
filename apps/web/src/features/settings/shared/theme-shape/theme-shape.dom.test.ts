import { beforeEach, describe, expect, it } from 'vitest';

import { PREFERENCES_STORAGE_KEY } from '../appearance-attributes';
import { applyThemeShape, themeShapeBootScript } from './theme-shape';

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
  new Function(themeShapeBootScript)();
}

describe('applyThemeShape', () => {
  it('writes the corner radius and density as attributes on the element', () => {
    applyThemeShape(document.documentElement, {
      radius: 'rounded',
      density: 'compact',
    });
    expect(dataset()).toEqual({ radius: 'rounded', density: 'compact' });
  });

  it('writes to any element, so a preview can carry its own', () => {
    const frame = document.createElement('div');
    applyThemeShape(frame, { radius: 'sharp', density: 'spacious' });
    expect(frame.dataset).toMatchObject({
      radius: 'sharp',
      density: 'spacious',
    });
    expect(dataset()).toEqual({});
  });
});

describe('themeShapeBootScript', () => {
  it('writes the defaults when nothing is saved', () => {
    boot();
    expect(dataset()).toEqual({ radius: 'default', density: 'comfortable' });
  });

  it('writes the same attributes the provider would for saved choices', () => {
    boot(JSON.stringify({ theme: { radius: 'round', density: 'compact' } }));
    const fromBoot = dataset();
    for (const key of Object.keys(document.documentElement.dataset)) {
      delete document.documentElement.dataset[key];
    }
    applyThemeShape(document.documentElement, {
      radius: 'round',
      density: 'compact',
    });
    expect(dataset()).toEqual(fromBoot);
  });

  it('falls back per field when a saved value is missing or not a preset', () => {
    boot(JSON.stringify({ theme: { radius: 'pill', density: 'spacious' } }));
    expect(dataset()).toEqual({ radius: 'default', density: 'spacious' });
  });

  it('accepts only presets, so tampered storage cannot write an arbitrary attribute', () => {
    boot(
      JSON.stringify({
        theme: { radius: '"><script>alert(1)</script>', density: 7 },
      }),
    );
    expect(dataset()).toEqual({ radius: 'default', density: 'comfortable' });
  });

  it.each(['{not json', 'null', '"text"', '[]', '{"theme":null}'])(
    'does not throw on stored %s and writes the defaults',
    (saved) => {
      expect(() => boot(saved)).not.toThrow();
      expect(dataset()).toEqual({ radius: 'default', density: 'comfortable' });
    },
  );
});
