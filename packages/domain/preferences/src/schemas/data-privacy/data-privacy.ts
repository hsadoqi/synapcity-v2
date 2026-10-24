import { z } from 'zod';

/** Each reason data may be collected. A collector asks for one of these. */
export const privacyPurposes = [
  'analytics',
  'errorReports',
  'sharing',
] as const;
export type PrivacyPurpose = (typeof privacyPurposes)[number];

/**
 * The wording each choice is made under. Raise a purpose's number when what
 * it collects, or who receives it, changes (its row in the Data privacy tab or
 * its section of /privacy): grants made under an earlier number are turned off
 * and that purpose alone is asked again.
 */
export const PRIVACY_POLICY_VERSIONS: Record<PrivacyPurpose, number> = {
  analytics: 1,
  errorReports: 1,
  sharing: 1,
};

/** Bare booleans saved before versioning were chosen under the first wording. */
const LEGACY_VERSION = 1;

const consentSchema = z.object({
  granted: z.boolean(),
  updatedAt: z.iso.datetime().nullable(),
  /** The wording it was chosen under; null when never chosen. */
  version: z.number().int().positive().nullable().default(null),
  /** Turned off because the wording changed; the tab asks again. */
  askAgain: z.boolean().default(false),
});
export type Consent = z.infer<typeof consentSchema>;

const notChosen: Consent = {
  granted: false,
  updatedAt: null,
  version: null,
  askAgain: false,
};

const consent = z
  .preprocess(
    (value) =>
      typeof value === 'boolean'
        ? { granted: value, updatedAt: null, version: LEGACY_VERSION }
        : value,
    consentSchema,
  )
  .default(notChosen);

export const dataPrivacySchema = z.object({
  analytics: consent,
  errorReports: consent,
  sharing: consent,
  askAgain: z.boolean().default(false),
});

export type DataPrivacySettings = z.infer<typeof dataPrivacySchema>;
export type DataPrivacySettingsPatch = Partial<DataPrivacySettings>;

export const dataPrivacyDefaults: DataPrivacySettings = dataPrivacySchema.parse(
  {},
);

/** A choice made now, under the current wording for its purpose. */
export function choose(purpose: PrivacyPurpose, granted: boolean): Consent {
  return {
    granted,
    updatedAt: new Date().toISOString(),
    version: PRIVACY_POLICY_VERSIONS[purpose],
    askAgain: false,
  };
}

/**
 * Turns off each grant not made under its purpose's current wording, and marks
 * it to be asked again. A choice to say no stands whatever the wording.
 */
export function withCurrentPolicy(
  privacy: DataPrivacySettings,
): DataPrivacySettings {
  let next = privacy;
  for (const purpose of privacyPurposes) {
    const entry = privacy[purpose];
    if (entry.granted && entry.version !== PRIVACY_POLICY_VERSIONS[purpose]) {
      next = {
        ...next,
        [purpose]: { ...entry, granted: false, askAgain: true },
      };
    }
  }
  return next;
}
