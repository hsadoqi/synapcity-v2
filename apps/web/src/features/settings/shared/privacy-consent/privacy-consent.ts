import { useSyncExternalStore } from 'react';
import {
  PRIVACY_POLICY_VERSION,
  type DataPrivacySettings,
  type PrivacyPurpose,
} from '../../types/data-privacy';

/** What the browser asks for, read at runtime and never saved. */
export type PrivacySignals = { globalPrivacyControl: boolean };

// Global Privacy Control asks sites not to sell or share data. It says nothing
// about first-party analytics or error reports, so it only blocks sharing.
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
 * Collection needs a grant made under the current wording and no browser
 * signal against it.
 */
export function canCollect(
  privacy: DataPrivacySettings,
  purpose: PrivacyPurpose,
  signals: PrivacySignals,
) {
  return (
    privacy.policyVersion === PRIVACY_POLICY_VERSION &&
    privacy[purpose].granted &&
    !isBlockedBySignals(purpose, signals)
  );
}

function readGlobalPrivacyControl() {
  // Not in the DOM types yet; browsers without it leave it undefined.
  const { globalPrivacyControl } = navigator as Navigator & {
    globalPrivacyControl?: boolean;
  };
  return globalPrivacyControl === true;
}

// The signal is fixed for the life of the page; there is no change event.
const subscribe = () => () => {};

/** Whether the browser sends Global Privacy Control. False on the server. */
export function useGlobalPrivacyControl() {
  return useSyncExternalStore(subscribe, readGlobalPrivacyControl, () => false);
}
