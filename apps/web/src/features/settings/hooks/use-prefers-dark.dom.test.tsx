import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { usePrefersDark } from './use-prefers-dark';

afterEach(() => vi.unstubAllGlobals());

const device = (dark: boolean) =>
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: dark,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );

describe('usePrefersDark', () => {
  it.each([true, false])('reports a device that asks for dark: %s', (dark) => {
    device(dark);

    expect(renderHook(() => usePrefersDark()).result.current).toBe(dark);
  });

  it('reports light, without throwing, where matchMedia does not exist', () => {
    vi.stubGlobal('matchMedia', undefined);

    expect(renderHook(() => usePrefersDark()).result.current).toBe(false);
  });
});
