import { describe, expectTypeOf, it } from 'vitest';

import type { ProfileState } from '.';

describe('ProfileState', () => {
  it('is one shape for every profile action, with every field optional', () => {
    expectTypeOf<ProfileState>().toEqualTypeOf<{
      error?: string;
      fields?: ('name' | 'avatar')[];
      message?: string;
      name?: string;
      avatarUrl?: string | null;
      saved?: boolean;
      signedOut?: boolean;
    }>();
    expectTypeOf<Record<string, never>>().toExtend<ProfileState>();
  });
});
