import {
  PRIVACY_POLICY_VERSIONS,
  type DataPrivacySettings,
  type PrivacyPurpose,
} from '../../schemas';

/** What the browser asks for, read at runtime and never saved. */
export type PrivacySignals = { globalPrivacyControl: boolean };

// Global Privacy Control asks sites not to sell or share data. It does not
// cover analytics or error reports run on the site's behalf, so it only blocks
// sharing.
const blockedByGlobalPrivacyControl: ReadonlySet<PrivacyPurpose> = new Set([
  'sharing',
]);

/** True when a browser signal overrides the saved choice for this purpose. */
export function isBlockedBySignals(
  purpose: PrivacyPurpose,
  signals: PrivacySignals,
) {
  return (
    signals.globalPrivacyControl && blockedByGlobalPrivacyControl.has(purpose)
  );
}

/**
 * The one check every collector makes before it loads or sends anything.
 * Collection needs a grant made under the purpose's current wording and no
 * browser signal against it.
 */
export function canCollect(
  privacy: DataPrivacySettings,
  purpose: PrivacyPurpose,
  signals: PrivacySignals,
) {
  const entry = privacy[purpose];
  return (
    entry.granted &&
    entry.version === PRIVACY_POLICY_VERSIONS[purpose] &&
    !isBlockedBySignals(purpose, signals)
  );
}
