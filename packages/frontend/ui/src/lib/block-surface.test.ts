import { describe, expect, it } from 'vitest';

import {
  blockSurface,
  invertedClasses,
  surfaceClasses,
} from '@synapcity/frontend-ui/lib/block-surface';

describe('blockSurface', () => {
  it('is a solid card by default', () => {
    const classes = blockSurface({});
    expect(classes).toContain('bg-card');
    expect(classes).not.toContain('backdrop-blur');
    expect(classes).not.toContain('theme-dark');
    expect(classes).not.toContain('border');
  });

  it('frosts the card on glass', () => {
    expect(blockSurface({ surface: 'glass' })).toContain('backdrop-blur-md');
  });

  it('inverts by re-scoping the theme, not by swapping two colours', () => {
    const classes = blockSurface({ inverted: true });
    expect(classes).toContain(invertedClasses);
    expect(classes).toContain(surfaceClasses.card);
  });

  it('draws a border from the theme only when asked', () => {
    expect(blockSurface({ bordered: true })).toContain('border-border/15');
  });

  it('puts the classes it is given last, so layout can adjust them', () => {
    expect(blockSurface({ className: 'w-full' }).endsWith('w-full')).toBe(true);
  });
});
