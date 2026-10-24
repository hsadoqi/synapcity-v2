import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useGlobalPrivacyControl } from './use-global-privacy-control';

afterEach(() => {
  delete (navigator as { globalPrivacyControl?: boolean }).globalPrivacyControl;
});

describe('useGlobalPrivacyControl', () => {
  it('reads the browser signal', () => {
    Object.defineProperty(navigator, 'globalPrivacyControl', {
      value: true,
      configurable: true,
    });
    expect(renderHook(useGlobalPrivacyControl).result.current).toBe(true);
  });

  it('is false when the browser does not send it', () => {
    expect(renderHook(useGlobalPrivacyControl).result.current).toBe(false);
  });
});
