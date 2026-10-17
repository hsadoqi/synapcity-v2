import { describe, expect, it } from 'vitest';

import {
  PRIVACY_POLICY_VERSION,
  dataPrivacySchema,
} from '../../types/data-privacy';
import { canCollect, isBlockedBySignals } from './privacy-consent';

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
