'use client';

import type { ReactNode } from 'react';
import { SynapcityLogo } from '../../components/logo-mark';
import { ModeToggle } from '../../components/mode-toggle';
import Link from 'next/link';
import { LinkButton } from '../../components/link-button';
import { Cog } from 'lucide-react';
import React from 'react';
import { cn } from '../../lib/utils';
import { SidebarTrigger } from '../../components/ui/sidebar';
import { Separator } from '../../components/ui/separator';

type RootHeaderProps = {
  actions?: ReactNode;
  userId?: string | null;
};

/**
 * Logo and utility actions, with no landmark and no padding of its own. The
 * sidebar shell places it inside its own header bar; RootHeader wraps it for
 * the signed-out page. Neither nests one <header> inside another.
 */
export const RootHeaderContent = ({ actions, userId }: RootHeaderProps) => {
  return (
    <div className="flex flex-1 items-center justify-between gap-4">
      <RootLogoLink userId={userId} />
      <RootIconActions userId={userId}>{actions}</RootIconActions>
    </div>
  );
};

export const RootHeader = ({ userId, ...props }: RootHeaderProps) => {
  // Same gutters as RootContent and RootFooter so the logo lines up with the
  // page below it.
  return (
    <div className="flex items-center">
      {userId && (
        <>
          <SidebarTrigger className="shrink-0 mx-2" size="icon-xl" />
          <Separator orientation="vertical" className="h-full" />
        </>
      )}
      <header className="flex items-center gap-2 px-2 md:px-6 py-2 lg:px-12 flex-1">
        <RootHeaderContent userId={userId} {...props} />
      </header>
    </div>
  );
};

const RootLogoLink = ({
  userId,
  className,
}: {
  userId?: string | null;
  className?: string;
}) => {
  const [logoPath, setLogoPath] = React.useState<string | null>('/');
  React.useEffect(() => {
    if (userId) {
      setLogoPath(`/${userId}/home`);
    }
  }, [userId]);
  return (
    <Link
      href={`${logoPath}`}
      className={cn(
        'inline-flex min-h-6 items-center pointer-coarse:min-h-11',
        className,
      )}
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
      size="icon-xl"
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
    <div className="flex items-center gap-2">
      <ModeToggle variant="ghost" size="xl" />
      {userId && <SettingsLinkIcon userId={userId} />}
      {children}
    </div>
  );
};
