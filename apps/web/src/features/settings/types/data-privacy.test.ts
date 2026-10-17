import { describe, expect, it } from 'vitest';

import {
  PRIVACY_POLICY_VERSION,
  dataPrivacyDefaults,
  dataPrivacySchema,
  withCurrentPolicy,
} from './data-privacy';

const at = '2026-10-17T12:00:00.000Z';

describe('data privacy schema', () => {
  it('starts with nothing granted and no wording agreed to', () => {
    expect(dataPrivacyDefaults).toEqual({
      analytics: { granted: false, updatedAt: null },
      errorReports: { granted: false, updatedAt: null },
      sharing: { granted: false, updatedAt: null },
      policyVersion: null,
    });
  });

  it('reads a bare boolean saved by an earlier version as an undated choice', () => {
    expect(dataPrivacySchema.parse({ analytics: true }).analytics).toEqual({
      granted: true,
      updatedAt: null,
    });
  });

  it('rejects a date that is not an ISO timestamp', () => {
    expect(
      dataPrivacySchema.safeParse({
        sharing: { granted: true, updatedAt: 'yesterday' },
      }).success,
    ).toBe(false);
  });
});

describe('withCurrentPolicy', () => {
  const granted = dataPrivacySchema.parse({
    analytics: { granted: true, updatedAt: at },
    sharing: { granted: true, updatedAt: at },
    policyVersion: PRIVACY_POLICY_VERSION,
  });

  it('keeps grants made under the current wording', () => {
    expect(withCurrentPolicy(granted)).toBe(granted);
  });

  it('turns off grants made under other wording and keeps when they were made', () => {
    for (const policyVersion of [null, PRIVACY_POLICY_VERSION + 1]) {
      const next = withCurrentPolicy({ ...granted, policyVersion });
      expect(next.analytics).toEqual({ granted: false, updatedAt: at });
      expect(next.sharing).toEqual({ granted: false, updatedAt: at });
      expect(next.policyVersion).toBeNull();
    }
  });
});
