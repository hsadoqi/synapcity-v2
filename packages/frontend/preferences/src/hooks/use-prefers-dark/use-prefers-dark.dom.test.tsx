import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockViewport } from '@synapcity/dev-vitest-config/viewport';

import { usePrefersDark } from './use-prefers-dark';

afterEach(() => vi.unstubAllGlobals());

describe('usePrefersDark', () => {
  it.each([true, false])('reports a device that asks for dark: %s', (dark) => {
    mockViewport({ dark });

    expect(renderHook(() => usePrefersDark()).result.current).toBe(dark);
  });

  it('reports light, without throwing, where matchMedia does not exist', () => {
    vi.stubGlobal('matchMedia', undefined);

    expect(renderHook(() => usePrefersDark()).result.current).toBe(false);
  });
});
