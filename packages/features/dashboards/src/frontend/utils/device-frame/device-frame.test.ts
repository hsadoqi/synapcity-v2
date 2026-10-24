import { describe, expect, it } from 'vitest';

import { DEVICE_FRAME_WIDTH } from './index';

describe('DEVICE_FRAME_WIDTH', () => {
  it('frames tablet and mobile, and lets desktop fill the canvas', () => {
    expect(DEVICE_FRAME_WIDTH).toEqual({ lg: null, md: 834, sm: 390 });
  });
});
