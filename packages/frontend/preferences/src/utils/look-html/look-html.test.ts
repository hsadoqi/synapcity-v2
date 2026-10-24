import { describe, expect, it } from 'vitest';
import { lookOf, settingsDefaults } from '@synapcity/domain-preferences';
import { lookHtmlAttributes } from './look-html';

describe('lookHtmlAttributes', () => {
  it('maps every default look field to safe first-paint HTML attributes', () => {
    expect(lookHtmlAttributes(lookOf(settingsDefaults))).toEqual({
      'data-animations': 'true',
      'data-borders': 'false',
      'data-contrast': 'none',
      'data-density': 'comfortable',
      'data-radius': 'default',
      'data-reduced-motion': 'false',
      'data-text-size': '100',
      style: { '--text-scale': '1' },
    });
  });

  it('renders an explicit mode and catalog font variables', () => {
    const look = lookOf({
      ...settingsDefaults,
      theme: {
        ...settingsDefaults.theme,
        mode: 'dark',
        headingFont: 'lora',
        bodyFont: 'dm-sans',
        codeFont: 'fira-code',
        textSize: 120,
      },
    });

    expect(lookHtmlAttributes(look)).toMatchObject({
      className: 'dark',
      'data-text-size': '120',
      style: {
        colorScheme: 'dark',
        '--text-scale': '1.2',
        '--font-preference-heading': "'Lora', serif",
        '--font-preference-body': "'DM Sans', sans-serif",
        '--font-preference-code': "'Fira Code', monospace",
      },
    });
  });
});
