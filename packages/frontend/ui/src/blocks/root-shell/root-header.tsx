import type { ReactNode } from 'react';
import { SynapcityLogo } from '../../components/logo-mark';
import { ModeToggle } from '../../components/mode-toggle';
import Link from 'next/link';
import { LinkButton } from '../../components/link-button';
import { Cog } from 'lucide-react';
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
  // Derived from the prop, not synced into state: state plus an effect would
  // server-render `/` for a signed-in user and only correct it after hydration.
  const logoPath = userId ? `/${userId}/home` : '/';
  return (
    <Link
      href={logoPath}
      className={cn(
        'inline-flex min-h-6 items-center pointer-coarse:min-h-11',
        className,
      )}
    >
      <SynapcityLogo size="sm" className="text-foreground" />
    </Link>
  );
};

const SettingsLinkIcon = ({ userId }: { userId: string }) => {
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
