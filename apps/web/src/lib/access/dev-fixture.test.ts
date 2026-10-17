import { afterEach, describe, expect, it, vi } from 'vitest';

import { fixtureModeEnabled } from './dev-fixture';

function mode(nodeEnv: string, flag?: string) {
  vi.stubEnv('NODE_ENV', nodeEnv);
  if (flag === undefined) vi.stubEnv('SYNAPCITY_DEV_AUTH', '');
  else vi.stubEnv('SYNAPCITY_DEV_AUTH', flag);
  return fixtureModeEnabled();
}

describe('fixtureModeEnabled', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('is off in development unless the flag is set', () => {
    expect(mode('development')).toBe(false);
    expect(mode('development', '1')).toBe(false);
    expect(mode('development', 'true')).toBe(false);
  });

  it('is on in development with the exact opt-in value', () => {
    expect(mode('development', 'fixture')).toBe(true);
  });

  it('is off in test and production even when the flag is set', () => {
    expect(mode('test', 'fixture')).toBe(false);
    expect(mode('production', 'fixture')).toBe(false);
  });
});
