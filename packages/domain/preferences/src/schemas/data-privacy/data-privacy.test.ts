import { describe, expect, it } from 'vitest';

import {
  PRIVACY_POLICY_VERSIONS,
  choose,
  dataPrivacyDefaults,
  dataPrivacySchema,
  withCurrentPolicy,
} from './data-privacy';

const at = '2026-10-17T12:00:00.000Z';
const grant = (version: number) => ({
  granted: true,
  updatedAt: at,
  version,
  askAgain: false,
});

describe('data privacy schema', () => {
  it('starts with nothing chosen', () => {
    const notChosen = {
      granted: false,
      updatedAt: null,
      version: null,
      askAgain: false,
    };
    expect(dataPrivacyDefaults).toEqual({
      analytics: notChosen,
      errorReports: notChosen,
      sharing: notChosen,
    });
  });

  it('reads a bare boolean saved by an earlier version as an undated choice under the first wording', () => {
    expect(dataPrivacySchema.parse({ analytics: true }).analytics).toEqual({
      granted: true,
      updatedAt: null,
      version: 1,
      askAgain: false,
    });
  });

  it('reads an entry without a version as chosen under no wording', () => {
    expect(
      dataPrivacySchema.parse({ sharing: { granted: true, updatedAt: at } })
        .sharing.version,
    ).toBeNull();
  });

  it('rejects a date that is not an ISO timestamp', () => {
    expect(
      dataPrivacySchema.safeParse({
        sharing: { granted: true, updatedAt: 'yesterday' },
      }).success,
    ).toBe(false);
  });

  it('reads the time as an instant, with Z or a numeric offset', () => {
    for (const updatedAt of [at, '2026-10-17T12:00:00+00:00']) {
      expect(
        dataPrivacySchema.safeParse({ sharing: { granted: true, updatedAt } })
          .success,
      ).toBe(true);
    }
  });
});

describe('choose', () => {
  it('records the time and the current wording for that purpose', () => {
    const choice = choose('errorReports', true);
    expect(choice).toMatchObject({
      granted: true,
      version: PRIVACY_POLICY_VERSIONS.errorReports,
      askAgain: false,
    });
    expect(Number.isNaN(Date.parse(choice.updatedAt!))).toBe(false);
  });
});

describe('withCurrentPolicy', () => {
  it('keeps grants made under each purpose’s current wording', () => {
    const privacy = dataPrivacySchema.parse({
      analytics: grant(PRIVACY_POLICY_VERSIONS.analytics),
      sharing: grant(PRIVACY_POLICY_VERSIONS.sharing),
    });
    expect(withCurrentPolicy(privacy)).toBe(privacy);
  });

  it('turns off only the grant whose wording changed, and asks again', () => {
    const next = withCurrentPolicy(
      dataPrivacySchema.parse({
        analytics: grant(PRIVACY_POLICY_VERSIONS.analytics),
        sharing: grant(PRIVACY_POLICY_VERSIONS.sharing + 1),
      }),
    );
    expect(next.analytics.granted).toBe(true);
    expect(next.sharing).toEqual({
      granted: false,
      updatedAt: at,
      version: PRIVACY_POLICY_VERSIONS.sharing + 1,
      askAgain: true,
    });
  });

  it('turns off a grant with no wording at all', () => {
    const next = withCurrentPolicy(
      dataPrivacySchema.parse({ sharing: { granted: true, updatedAt: at } }),
    );
    expect(next.sharing.granted).toBe(false);
  });

  it('leaves a refusal alone whatever the wording', () => {
    const privacy = dataPrivacySchema.parse({
      sharing: { ...grant(99), granted: false },
    });
    expect(withCurrentPolicy(privacy)).toBe(privacy);
  });
});
