import { z } from 'zod';

/**
 * The wording a privacy choice was made under. Raise it when the description
 * of what a purpose collects, or who receives it, changes: every choice made
 * under an earlier version is turned off, so people are asked again.
 */
export const PRIVACY_POLICY_VERSION = 1;

/** Choices saved before versioning were made under the first wording. */
export const LEGACY_PRIVACY_POLICY_VERSION = 1;

/** Each reason data may be collected. A collector asks for one of these. */
export const privacyPurposes = [
  'analytics',
  'errorReports',
  'sharing',
] as const;
export type PrivacyPurpose = (typeof privacyPurposes)[number];

const consentSchema = z.object({
  granted: z.boolean(),
  updatedAt: z.iso.datetime().nullable(),
});

// Earlier versions saved a bare boolean; read it as a choice with no date.
const consent = z
  .preprocess(
    (value) =>
      typeof value === 'boolean' ? { granted: value, updatedAt: null } : value,
    consentSchema,
  )
  .default({ granted: false, updatedAt: null });

export const dataPrivacySchema = z.object({
  analytics: consent,
  errorReports: consent,
  sharing: consent,
  policyVersion: z.number().int().positive().nullable().default(null),
});

export type DataPrivacySettings = z.infer<typeof dataPrivacySchema>;
export type DataPrivacySettingsPatch = Partial<DataPrivacySettings>;

export const dataPrivacyDefaults: DataPrivacySettings = dataPrivacySchema.parse(
  {},
);

/** Turns off every grant that was not made under the current wording. */
export function withCurrentPolicy(
  privacy: DataPrivacySettings,
): DataPrivacySettings {
  if (privacy.policyVersion === PRIVACY_POLICY_VERSION) return privacy;
  const next = { ...privacy, policyVersion: null };
  for (const purpose of privacyPurposes) {
    next[purpose] = { ...privacy[purpose], granted: false };
  }
  return next;
}
