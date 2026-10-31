import { describe, expect, it } from 'vitest';

import * as geometry from './geometry';

// These pin the shipped logo. A change here is a change to the brand: it needs
// the owner's approval (PRODUCT.md, "Brand commitments") and a new sync.
describe('geometry', () => {
  it('pins the mark grid', () => {
    expect({
      grid: geometry.MARK_GRID,
      square: geometry.SQUARE,
      radius: geometry.SQUARE_RADIUS,
      stroke: geometry.STROKE,
      back: geometry.BACK,
      front: geometry.FRONT,
      core: geometry.CORE,
      coreOrigin: geometry.CORE_ORIGIN,
      coreRadius: geometry.CORE_RADIUS,
    }).toEqual({
      grid: 32,
      square: 18,
      radius: 3.5,
      stroke: 2.25,
      back: 3,
      front: 11,
      core: 4.5,
      coreOrigin: 13.75,
      coreRadius: 0.75,
    });
  });

  it('pins the wordmark and logo boxes', () => {
    expect([
      geometry.WORDMARK_WIDTH,
      geometry.WORDMARK_HEIGHT,
      geometry.LOGO_WIDTH,
      geometry.LOGO_HEIGHT,
      geometry.LOGO_MARK_SCALE,
    ]).toEqual([4348, 865, 5868, 1100, 34.375]);
  });

  it('pins the outlines by length and anchors', () => {
    expect(geometry.WORDMARK_PATH).toHaveLength(2664);
    expect(geometry.WORDMARK_PATH.startsWith('M0 547 110 542Q117 588')).toBe(
      true,
    );
    expect(
      geometry.WORDMARK_PATH.endsWith(
        'L4136 777Q4120 823 4088.5 844Q4057 865 4002 865H3922Z',
      ),
    ).toBe(true);
    expect(geometry.LOGO_WORDMARK_PATH).toHaveLength(2762);
    expect(geometry.LOGO_WORDMARK_PATH.startsWith('M1520 647 1630 642')).toBe(
      true,
    );
  });
});
