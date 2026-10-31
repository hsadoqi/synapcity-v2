'use client';

import type { ReactNode } from 'react';
import { PanelLeftIcon } from 'lucide-react';
import { SynapcityLogo, SynapcityMark } from '@synapcity/frontend-brand/react';
import { ModeToggle } from '@synapcity/frontend-ui/components/mode-toggle';
import { cn } from '@synapcity/frontend-ui/lib/utils';
import type { AccountLinks } from '@synapcity/frontend-ui/lib/account-links';
import { Separator } from '@synapcity/frontend-ui/core/separator';
import { GlobalPanelToggle } from '../global-panel';
import { ShellLink } from '../../../providers/shell-navigation';
import {
  SidebarTrigger,
  useSidebar,
} from '@synapcity/frontend-ui/core/sidebar';
import { IconButton } from '@synapcity/frontend-ui/components/icon-button';
import {
  HeaderBreadcrumbs,
  type RootBreadcrumb,
} from '../../header-breadcrumbs';

type RootHeaderProps = {
  actions?: ReactNode;
  /** The path to the current page, shown instead of the logo once someone is signed in. */
  breadcrumbs?: RootBreadcrumb[];
  /** Present when someone is signed in. The app decides where these lead. */
  account?: AccountLinks | null;
};

/**
 * Logo and utility actions, with no landmark and no padding of its own. The
 * sidebar shell places it inside its own header bar; RootHeader wraps it for
 * the signed-out page. Neither nests one <header> inside another.
 */
export const RootHeaderContent = ({
  actions,
  account,
  breadcrumbs,
}: RootHeaderProps) => {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
      {/* Signed in, a page's trail shows here; without one, the brand does,
          leading to the person's home. */}
      {account && breadcrumbs?.length ? (
        <HeaderBreadcrumbs items={breadcrumbs} />
      ) : (
        <RootLogoLink homeHref={account?.homeHref ?? '/'} />
      )}
      <RootIconActions signedIn={!!account}>
        {account && <GlobalPanelToggle />}
        {actions}
      </RootIconActions>
    </div>
  );
};

export const RootHeader = ({ account, ...props }: RootHeaderProps) => {
  // Same gutters as RootContent and RootFooter so the logo lines up with the
  // page below it.
  return (
    <div className="sticky top-0 z-10 flex h-16 shrink-0 items-stretch border-b border-border bg-background">
      <header
        className={cn(
          'flex min-w-0 flex-1 items-center justify-between',
          account ? 'px-3 sm:px-4 lg:px-6' : 'px-4 sm:px-10 lg:px-16',
        )}
      >
        {account && (
          <>
            <div className="flex shrink-0 items-center p-2">
              <HeaderSidebarTrigger />
              <Separator orientation="vertical" />
            </div>
          </>
        )}
        <RootHeaderContent account={account} {...props} />
      </header>
    </div>
  );
};

/**
 * The sidebar toggle, drawn as a panel icon so the logo beside it carries the
 * brand. Its name and aria-expanded follow the sidebar: the sheet on phones,
 * expanded or folded to icons elsewhere.
 */
const HeaderSidebarTrigger = () => {
  const { state, isMobile, openMobile } = useSidebar();
  const expanded = isMobile ? openMobile : state === 'expanded';
  return (
    <SidebarTrigger
      render={
        <IconButton
          variant="ghost"
          aria-label={expanded ? 'Close sidebar' : 'Open sidebar'}
          aria-expanded={expanded}
        >
          <PanelLeftIcon aria-hidden="true" />
        </IconButton>
      }
    />
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
    <ShellLink
      href={homeHref}
      aria-label="Synapcity home"
      className={cn(
        'inline-flex min-h-10 shrink-0 items-center rounded-sm transition-opacity hover:opacity-70 pointer-coarse:min-h-11',
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
    </ShellLink>
  );
};

// Settings lives in the sidebar's core links, not here.
const RootIconActions = ({
  signedIn,
  children,
}: {
  /** Signed in, phones reach the theme toggle in the sidebar sheet instead. */
  signedIn: boolean;
  children?: ReactNode;
}) => {
  return (
    <nav
      aria-label="Account and appearance"
      className="flex items-center gap-1"
    >
      <ModeToggle
        variant="ghost"
        size="lg"
        className={cn('shrink-0', signedIn && 'hidden md:block')}
      />
      {children}
    </nav>
  );
};
