import { beforeEach, describe, expect, it } from 'vitest';

import { PREFERENCES_STORAGE_KEY } from '../appearance-attributes';
import {
  applyThemeShape,
  previewShapeAttributes,
  previewTextScaleStyle,
  themeShapeBootScript,
} from './theme-shape';

const root = document.documentElement;
const dataset = () => ({ ...root.dataset });
const scale = (element: HTMLElement = root) =>
  element.style.getPropertyValue('--text-scale');
const defaults = { radius: 'default', density: 'comfortable', textSize: '100' };

beforeEach(() => {
  localStorage.clear();
  for (const key of Object.keys(root.dataset)) {
    delete root.dataset[key];
  }
  root.style.removeProperty('--text-scale');
});

function boot(saved?: string) {
  if (saved !== undefined) localStorage.setItem(PREFERENCES_STORAGE_KEY, saved);
  // The script is the string the layout inlines; run it as the browser would.
  new Function(themeShapeBootScript)();
}

describe('applyThemeShape', () => {
  it('writes the radius, density and text size, with the text scale beside them', () => {
    applyThemeShape(root, {
      radius: 'soft',
      density: 'compact',
      textSize: 115,
    });
    expect(dataset()).toEqual({
      radius: 'soft',
      density: 'compact',
      textSize: '115',
    });
    expect(scale()).toBe('1.15');
  });

  it('writes to any element, so a preview can carry its own', () => {
    const frame = document.createElement('div');
    applyThemeShape(frame, {
      radius: 'sharp',
      density: 'spacious',
      textSize: 90,
    });
    expect(frame.dataset).toMatchObject({
      radius: 'sharp',
      density: 'spacious',
      textSize: '90',
    });
    expect(scale(frame)).toBe('0.9');
    expect(dataset()).toEqual({});
  });
});

describe('previewShapeAttributes and previewTextScaleStyle', () => {
  it('match what applyThemeShape writes, so a preview matches the page', () => {
    const theme = { radius: 'soft', density: 'compact', textSize: 85 } as const;
    const element = document.createElement('div');
    applyThemeShape(element, theme);
    expect(previewShapeAttributes(theme)).toEqual({
      'data-radius': element.getAttribute('data-radius'),
      'data-density': element.getAttribute('data-density'),
      'data-text-size': element.getAttribute('data-text-size'),
    });
    expect(previewTextScaleStyle(theme)).toEqual({
      '--text-scale': scale(element),
    });
  });
});

describe('themeShapeBootScript', () => {
  it('writes the defaults when nothing is saved', () => {
    boot();
    expect(dataset()).toEqual(defaults);
    expect(scale()).toBe('1');
  });

  it('writes the same attributes the provider would for saved choices', () => {
    boot(
      JSON.stringify({
        theme: { radius: 'rounded', density: 'compact', textSize: 130 },
      }),
    );
    const fromBoot = { ...dataset(), scale: scale() };
    for (const key of Object.keys(root.dataset)) {
      delete root.dataset[key];
    }
    root.style.removeProperty('--text-scale');
    applyThemeShape(root, {
      radius: 'rounded',
      density: 'compact',
      textSize: 130,
    });
    expect({ ...dataset(), scale: scale() }).toEqual(fromBoot);
  });

  it('falls back per field when a saved value is missing or not allowed', () => {
    boot(
      JSON.stringify({
        theme: { radius: 'pill', density: 'spacious', textSize: 103 },
      }),
    );
    expect(dataset()).toEqual({
      radius: 'default',
      density: 'spacious',
      textSize: '100',
    });
  });

  it.each([
    ['small', '95'],
    ['large', '115'],
  ])(
    'reads an old %s text size preset until the settings are saved again',
    (fontSize, textSize) => {
      boot(JSON.stringify({ appearance: { fontSize } }));
      expect(dataset().textSize).toBe(textSize);
    },
  );

  it('prefers a saved percentage over an old preset', () => {
    boot(
      JSON.stringify({
        theme: { textSize: 80 },
        appearance: { fontSize: 'large' },
      }),
    );
    expect(dataset().textSize).toBe('80');
    expect(scale()).toBe('0.8');
  });

  it('accepts only allowed values, so tampered storage cannot write an arbitrary attribute', () => {
    boot(
      JSON.stringify({
        theme: {
          radius: '"><script>alert(1)</script>',
          density: 7,
          textSize: '1);color:red',
        },
        appearance: { fontSize: 'constructor' },
      }),
    );
    expect(dataset()).toEqual(defaults);
    expect(scale()).toBe('1');
  });

  it.each(['{not json', 'null', '"text"', '[]', '{"theme":null}'])(
    'does not throw on stored %s and writes the defaults',
    (saved) => {
      expect(() => boot(saved)).not.toThrow();
      expect(dataset()).toEqual(defaults);
    },
  );
});
