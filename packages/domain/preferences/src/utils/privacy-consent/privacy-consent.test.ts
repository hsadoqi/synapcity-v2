import { describe, expect, it } from 'vitest';

import { PRIVACY_POLICY_VERSIONS, dataPrivacySchema } from '../../schemas';
import { canCollect, isBlockedBySignals } from './privacy-consent';

const none = { globalPrivacyControl: false };
const gpc = { globalPrivacyControl: true };
const grant = (version: number) => ({
  granted: true,
  updatedAt: null,
  version,
});
const allGranted = dataPrivacySchema.parse({
  analytics: grant(PRIVACY_POLICY_VERSIONS.analytics),
  errorReports: grant(PRIVACY_POLICY_VERSIONS.errorReports),
  sharing: grant(PRIVACY_POLICY_VERSIONS.sharing),
});

describe('canCollect', () => {
  it('refuses every purpose by default', () => {
    const privacy = dataPrivacySchema.parse({});
    for (const purpose of ['analytics', 'errorReports', 'sharing'] as const) {
      expect(canCollect(privacy, purpose, none)).toBe(false);
    }
  });

  it('allows a purpose granted under its current wording', () => {
    expect(canCollect(allGranted, 'analytics', none)).toBe(true);
  });

  it('refuses a grant made under other wording, or none', () => {
    for (const version of [PRIVACY_POLICY_VERSIONS.analytics + 1, null]) {
      expect(
        canCollect(
          { ...allGranted, analytics: { ...allGranted.analytics, version } },
          'analytics',
          none,
        ),
      ).toBe(false);
    }
  });

  it('lets Global Privacy Control block sharing only', () => {
    expect(canCollect(allGranted, 'sharing', gpc)).toBe(false);
    expect(canCollect(allGranted, 'analytics', gpc)).toBe(true);
    expect(canCollect(allGranted, 'errorReports', gpc)).toBe(true);
    expect(isBlockedBySignals('sharing', gpc)).toBe(true);
    expect(isBlockedBySignals('sharing', none)).toBe(false);
  });
});
