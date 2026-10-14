'use client';

import type { ReactNode } from 'react';
import { SynapcityLogo } from '../../components/logo-mark';
import { ModeToggle } from '../../components/mode-toggle';
import Link from 'next/link';
import React from 'react';
import { LinkButton } from '../../components/link-button';
import { Cog } from 'lucide-react';

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
        <RootIconActions userId={userId}>{actions}</RootIconActions>
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
    <Link
      href={`${logoPath}`}
      className="inline-flex min-h-6 items-center pointer-coarse:min-h-11"
    >
      <SynapcityLogo size="sm" className="text-foreground" />
    </Link>
  );
};

const SettingsLinkIcon = ({ userId }: { userId?: string | null }) => {
  // TODO: Implement user ID retrieval logic here. For now, we can use a placeholder or mock value.
  // const userId = useUserId(); // Replace with your actual user ID retrieval logic
  return (
    <LinkButton
      variant="ghost"
      href={`/${userId}/settings`}
      size="icon"
      aria-label="Settings"
    >
      <Cog />
    </LinkButton>
  );
};

const RootIconActions = ({
  userId,
  children,
}: {
  userId?: string | null;
  children?: ReactNode;
}) => {
  return (
    <div className="flex items-center gap-4">
      <ModeToggle variant="ghost" />
      <SettingsLinkIcon userId={userId} />
      {children}
    </div>
  );
};
