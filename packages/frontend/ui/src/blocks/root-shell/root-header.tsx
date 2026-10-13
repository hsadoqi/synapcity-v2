'use client';

import type { ReactNode } from 'react';
import { SynapcityLogo } from '../../components/logo-mark';
import { ModeToggle } from '../../components/mode-toggle';
import Link from 'next/link';
import React from 'react';

export const RootHeader = ({
  actions,
  userId,
}: {
  actions?: ReactNode;
  userId?: string | null;
}) => {
  return (
    <header className="flex w-full ">
      <div className="flex-1 flex items-center justify-between gap-4 bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2">
        <RootLogoLink userId={userId} />
        <RootIconActions>{actions}</RootIconActions>
      </div>
    </header>
  );
};

const RootLogoLink = ({ userId }: { userId?: string | null }) => {
  const [logoPath, setLogoPath] = React.useState<string | null>('/');
  React.useEffect(() => {
    if (userId) {
      setLogoPath(`/${userId}/home`);
    }
  }, [userId]);
  return (
    <Link href={`${logoPath}`}>
      <SynapcityLogo size="sm" className="text-foreground" />
    </Link>
  );
};

const RootIconActions = ({ children }: { children?: ReactNode }) => {
  return (
    <div className="flex items-center gap-4">
      <ModeToggle variant="ghost" />
      {children}
    </div>
  );
};
