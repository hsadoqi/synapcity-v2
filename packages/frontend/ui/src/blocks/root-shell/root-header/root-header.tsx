import type { ReactNode } from 'react';
import {
  SynapcityLogo,
  SynapcityMark,
} from '@synapcity/frontend-ui/components/logo-mark';
import { ModeToggle } from '@synapcity/frontend-ui/components/mode-toggle';
import Link from 'next/link';
import { LinkButton } from '@synapcity/frontend-ui/components/link-button';
import { Cog } from 'lucide-react';
import { cn } from '@synapcity/frontend-ui/lib/utils';
import type { AccountLinks } from '@synapcity/frontend-ui/lib/account-links';
import { SidebarTrigger } from '@synapcity/frontend-ui/core/sidebar';
import { Separator } from '@synapcity/frontend-ui/core/separator';

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
    <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
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
    <div className="sticky top-0 flex h-16 shrink-0 items-stretch border-b border-divider bg-background/95 supports-backdrop-filter:backdrop-blur-sm">
      {account && (
        <>
          <div className="flex shrink-0 items-center px-2 sm:px-3">
            <SidebarTrigger size="icon-lg" />
          </div>
          <Separator orientation="vertical" />
        </>
      )}
      <header
        className={cn(
          'flex min-w-0 flex-1 items-center',
          account ? 'px-3 sm:px-4 lg:px-6' : 'px-4 sm:px-10 lg:px-16',
        )}
      >
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
      aria-label="Synapcity home"
      className={cn(
        'inline-flex min-h-10 shrink-0 items-center rounded-sm outline-none transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-ring/50 pointer-coarse:min-h-11',
        className,
      )}
    >
      <SynapcityMark
        size="md"
        title={null}
        className="text-foreground sm:hidden"
      />
      <SynapcityLogo
        size="sm"
        title={null}
        className="hidden text-foreground sm:block"
      />
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
    <nav
      aria-label="Account and appearance"
      className="flex items-center gap-1"
    >
      {' '}
      <ModeToggle variant="ghost" size="lg" />
      {settingsHref && <SettingsLinkIcon href={settingsHref} />}
      {children}
    </nav>
  );
};
