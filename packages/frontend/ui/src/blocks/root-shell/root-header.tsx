import type { ReactNode } from 'react';
import { SynapcityLogo } from '../../components/logo-mark';
import { ModeToggle } from '../../components/mode-toggle';
import Link from 'next/link';
import { LinkButton } from '../../components/link-button';
import { Cog } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { AccountLinks } from '../../lib/account-links';
import { SidebarTrigger } from '../../components/ui/sidebar';
import { Separator } from '../../components/ui/separator';

type RootHeaderProps = {
  actions?: ReactNode;
  /** Present when someone is signed in. The app decides where these lead. */
  account?: AccountLinks | null;
};

/**
 * Logo and utility actions, with no landmark and no padding of its own. The
 * sidebar shell places it inside its own header bar; RootHeader wraps it for
 * the signed-out page. Neither nests one <header> inside another.
 */
export const RootHeaderContent = ({ actions, account }: RootHeaderProps) => {
  return (
    <div className="flex flex-1 items-center justify-between">
      <RootLogoLink homeHref={account?.homeHref} />
      <RootIconActions settingsHref={account?.settingsHref}>
        {actions}
      </RootIconActions>
    </div>
  );
};

export const RootHeader = ({ account, ...props }: RootHeaderProps) => {
  // Same gutters as RootContent and RootFooter so the logo lines up with the
  // page below it.
  return (
    <div className="flex items-center">
      {account && (
        <>
          <SidebarTrigger className="shrink-0 mx-2" size="icon-lg" />
          <Separator orientation="vertical" className="h-full" />
        </>
      )}
      <header className="flex items-center gap-2 px-2 lg:px-6 py-2  flex-1">
        <RootHeaderContent account={account} {...props} />
      </header>
    </div>
  );
};

const RootLogoLink = ({
  homeHref = '/',
  className,
}: {
  /** Where the logo leads. The landing page until someone is signed in. */
  homeHref?: string;
  className?: string;
}) => {
  return (
    <Link
      href={homeHref}
      className={cn(
        'inline-flex min-h-6 items-center pointer-coarse:min-h-11',
        className,
      )}
    >
      <SynapcityLogo size="sm" className="text-foreground" />
    </Link>
  );
};

const SettingsLinkIcon = ({ href }: { href: string }) => {
  return (
    <LinkButton
      variant="ghost"
      href={href}
      size="icon-lg"
      aria-label="Settings"
    >
      <Cog />
    </LinkButton>
  );
};

const RootIconActions = ({
  settingsHref,
  children,
}: {
  settingsHref?: string;
  children?: ReactNode;
}) => {
  return (
    <div className="flex items-center gap-2">
      <ModeToggle variant="ghost" size="lg" />
      {settingsHref && <SettingsLinkIcon href={settingsHref} />}
      {children}
    </div>
  );
};
