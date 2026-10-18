'use client';

import { Folder, type LucideProps } from 'lucide-react';
import { DynamicIcon, iconNames, type IconName } from 'lucide-react/dynamic';

const availableIconNames = new Set<string>(iconNames);

function isIconName(name: string): name is IconName {
  return availableIconNames.has(name);
}

type SpaceIconProps = LucideProps & { name: string };

/** Resolves the stored identifier without assuming it exists in this version. */
export function SpaceIcon({ name, ...props }: SpaceIconProps) {
  if (!isIconName(name)) return <Folder {...props} />;

  return (
    <DynamicIcon
      name={name}
      {...props}
      fallback={() => <Folder {...props} />}
    />
  );
}
