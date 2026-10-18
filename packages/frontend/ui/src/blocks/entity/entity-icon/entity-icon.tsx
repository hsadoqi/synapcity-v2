import { Folder, type LucideProps } from 'lucide-react';

import { findEntityIcon } from './entity-icons';

type EntityIconProps = LucideProps & { name: string };

/**
 * The icon for a stored identifier, from the fixed set in `entity-icons`.
 * Anything outside the set, including malformed input, shows the folder.
 * Renders on the server; nothing loads after the page arrives.
 */
export function EntityIcon({ name, ...props }: EntityIconProps) {
  const Icon = findEntityIcon(name)?.Icon ?? Folder;

  return <Icon {...props} />;
}
