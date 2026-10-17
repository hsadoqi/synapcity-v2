import { act, fireEvent, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DataPrivacySettings } from '../components/data-privacy-settings';
import { renderWithSettings, stubBrowser } from '../test-harness';
import { PRIVACY_POLICY_VERSION } from '../types/data-privacy';
import { useCanCollect } from './use-can-collect';

const KEY = 'synapcity-preferences';
const granted = (errorReports: boolean) =>
  JSON.stringify({
    privacy: {
      errorReports: { granted: errorReports, updatedAt: null },
      policyVersion: PRIVACY_POLICY_VERSION,
    },
  });

beforeEach(stubBrowser);
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

  it('follows the settings page in this tab, both ways', async () => {
    const { result } = renderHook(() => useCanCollect('errorReports'));
    await renderWithSettings(<DataPrivacySettings />);
    const toggle = screen.getByRole('switch', { name: 'Error reports' });

    fireEvent.click(toggle);
    expect(result.current).toBe(true);
    fireEvent.click(toggle);
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
        privacy: { sharing: true, policyVersion: PRIVACY_POLICY_VERSION },
      }),
    );
    expect(renderHook(() => useCanCollect('sharing')).result.current).toBe(
      false,
    );
  });
});
