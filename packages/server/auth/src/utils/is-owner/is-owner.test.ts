import { describe, expect, it } from 'vitest';

import { isOwner } from './index';

const verifiedAs = (userId: string) =>
  ({ status: 'verified', identity: { userId } }) as const;

describe('isOwner', () => {
  it('is true when the verified identity is the supplied user', () => {
    expect(isOwner(verifiedAs('u1'), 'u1')).toBe(true);
  });

  it('is false for someone else', () => {
    expect(isOwner(verifiedAs('u1'), 'u2')).toBe(false);
  });

  it('is false for an empty supplied id', () => {
    expect(isOwner(verifiedAs('u1'), '')).toBe(false);
  });

  it.each([{ status: 'signed-out' }, { status: 'unavailable' }] as const)(
    'is false when the caller is $status',
    (result) => {
      expect(isOwner(result, 'u1')).toBe(false);
    },
  );
});
