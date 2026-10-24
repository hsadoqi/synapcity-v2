import { describe, expect, it } from 'vitest';

import { emptyRecords } from '../record-tables';
import { clearSlotAsset, setSlotAsset } from './index';

const ctx = { ownerId: '11111111-1111-4111-8111-111111111111', now: 0 };

describe('assets', () => {
  it('keeps one asset per slot', () => {
    const image = (name: string) => ({
      slot: 's1',
      name,
      dataUrl: 'data:image/png;base64,AA',
    });
    let r = setSlotAsset(emptyRecords(), image('a.png'), ctx);
    r = setSlotAsset(r, image('b.png'), ctx);
    expect(Object.values(r.asset).map((a) => a.name)).toEqual(['b.png']);
    expect(clearSlotAsset(r, 's1').asset).toEqual({});
    expect(clearSlotAsset(r, 'other')).toBe(r);
  });
});
