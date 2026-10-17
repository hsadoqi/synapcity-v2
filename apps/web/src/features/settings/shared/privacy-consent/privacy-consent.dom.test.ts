import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  PRIVACY_POLICY_VERSION,
  dataPrivacySchema,
} from '../../types/data-privacy';
import {
  canCollect,
  isBlockedBySignals,
  useGlobalPrivacyControl,
} from './privacy-consent';

afterEach(() => {
  vi.unstubAllGlobals();
  // Set as an own property by the Global Privacy Control tests.
  delete (navigator as { globalPrivacyControl?: boolean }).globalPrivacyControl;
});

const none = { globalPrivacyControl: false };
const gpc = { globalPrivacyControl: true };
const allGranted = dataPrivacySchema.parse({
  analytics: true,
  errorReports: true,
  sharing: true,
  policyVersion: PRIVACY_POLICY_VERSION,
});

describe('canCollect', () => {
  it('refuses every purpose by default', () => {
    const privacy = dataPrivacySchema.parse({});
    for (const purpose of ['analytics', 'errorReports', 'sharing'] as const) {
      expect(canCollect(privacy, purpose, none)).toBe(false);
    }
  });

  it('allows a purpose granted under the current wording', () => {
    expect(canCollect(allGranted, 'analytics', none)).toBe(true);
  });

  it('refuses a grant made under other wording', () => {
    expect(
      canCollect(
        { ...allGranted, policyVersion: PRIVACY_POLICY_VERSION + 1 },
        'analytics',
        none,
      ),
    ).toBe(false);
  });

  it('lets Global Privacy Control block sharing only', () => {
    expect(canCollect(allGranted, 'sharing', gpc)).toBe(false);
    expect(canCollect(allGranted, 'analytics', gpc)).toBe(true);
    expect(canCollect(allGranted, 'errorReports', gpc)).toBe(true);
    expect(isBlockedBySignals('sharing', gpc)).toBe(true);
    expect(isBlockedBySignals('sharing', none)).toBe(false);
  });
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
