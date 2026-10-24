import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PRIVACY_POLICY_VERSIONS } from '@synapcity/domain-preferences';
import { announcePreferencesSaved, writeStoredPreferences } from '../../store';
import { useCanCollect } from './use-can-collect';

const KEY = 'synapcity-preferences';
const granted = (errorReports: boolean) =>
  JSON.stringify({
    privacy: {
      errorReports: {
        granted: errorReports,
        updatedAt: null,
        version: PRIVACY_POLICY_VERSIONS.errorReports,
      },
    },
  });

beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.unstubAllGlobals();
  delete (navigator as { globalPrivacyControl?: boolean }).globalPrivacyControl;
});

describe('useCanCollect', () => {
  it('is false with nothing saved, and with something unreadable', () => {
    expect(renderHook(() => useCanCollect('errorReports')).result.current).toBe(
      false,
    );
    localStorage.setItem(KEY, '{not json');
    expect(renderHook(() => useCanCollect('errorReports')).result.current).toBe(
      false,
    );
  });

  it('follows a grant saved in another tab', () => {
    const { result } = renderHook(() => useCanCollect('errorReports'));
    act(() => {
      localStorage.setItem(KEY, granted(true));
      window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
    });
    expect(result.current).toBe(true);
  });

  it('follows a save announced in this tab', () => {
    const { result } = renderHook(() => useCanCollect('errorReports'));
    act(() => {
      writeStoredPreferences(granted(true));
      announcePreferencesSaved();
    });
    expect(result.current).toBe(true);
    act(() => {
      writeStoredPreferences(granted(false));
      announcePreferencesSaved();
    });
    expect(result.current).toBe(false);
  });

  it('lets Global Privacy Control refuse sharing', () => {
    Object.defineProperty(navigator, 'globalPrivacyControl', {
      value: true,
      configurable: true,
    });
    localStorage.setItem(
      KEY,
      JSON.stringify({
        privacy: {
          sharing: {
            granted: true,
            updatedAt: null,
            version: PRIVACY_POLICY_VERSIONS.sharing,
          },
        },
      }),
    );
    expect(renderHook(() => useCanCollect('sharing')).result.current).toBe(
      false,
    );
  });
});
