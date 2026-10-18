import { Info } from 'lucide-react';
import {
  privacyPurposes,
  type DataPrivacySettings,
} from '../../types/data-privacy';
import { purposeCopy } from './data-privacy-rows';

/** Says which choices were turned off because what they cover changed. */
export const DataPrivacyAskAgain = ({
  privacy,
}: {
  privacy: DataPrivacySettings;
}) => {
  const labels = privacyPurposes
    .filter((purpose) => privacy[purpose].askAgain)
    .map((purpose) => purposeCopy[purpose].label);
  if (labels.length === 0) return null;
  return (
    <p className="flex items-start gap-2 text-sm text-muted-foreground">
      <Info className="size-4 shrink-0" />
      What {new Intl.ListFormat('en', { type: 'conjunction' }).format(
        labels,
      )}{' '}
      {labels.length === 1 ? 'covers' : 'cover'} has changed, so{' '}
      {labels.length === 1 ? 'it was' : 'they were'} turned off. Read the
      privacy notice and choose again below.
    </p>
  );
};
