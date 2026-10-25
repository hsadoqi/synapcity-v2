import * as React from 'react';
import type { ReactNode } from 'react';
import {
  SynapcityLogo,
  SynapcityMark,
} from '@synapcity/frontend-ui/components/logo-mark';
import { ModeToggle } from '@synapcity/frontend-ui/components/mode-toggle';
import { LinkButton } from '@synapcity/frontend-ui/next/link-button';
import { Cog } from 'lucide-react';
import { cn } from '@synapcity/frontend-ui/lib/utils';
import type { AccountLinks } from '@synapcity/frontend-ui/lib/account-links';
import { Separator } from '@synapcity/frontend-ui/core/separator';
import { GlobalPanelToggle } from '../global-panel';
import { ShellLink } from '../../../providers/shell-navigation';
import { SidebarTrigger } from '@synapcity/frontend-ui/core/sidebar';
import { IconButton } from '@synapcity/frontend-ui/components/icon-button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@synapcity/frontend-ui/core/breadcrumb';

/** One level of the trail. The last item is the current page and takes no link. */
export type RootBreadcrumb = {
  label: string;
  href?: string;
};

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
      {account ? (
        <RootBreadcrumbs items={breadcrumbs} />
      ) : (
        <RootLogoLink homeHref="/" />
      )}
      <RootIconActions settingsHref={account?.settingsHref}>
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
    <div className="sticky top-0 z-10 flex h-16 shrink-0 items-stretch border-b border-border bg-background/95 supports-backdrop-filter:backdrop-blur-sm">
      <header
        className={cn(
          'flex min-w-0 flex-1 items-center justify-between',
          account ? 'px-3 sm:px-4 lg:px-6' : 'px-4 sm:px-10 lg:px-16',
        )}
      >
        {account && (
          <>
            <div className="flex shrink-0 items-center p-2">
              <SidebarTrigger
                render={
                  <IconButton variant="ghost" aria-label="Open sidebar">
                    <SynapcityMark
                      size="sm"
                      title={null}
                      className="text-foreground"
                    />
                  </IconButton>
                }
              />
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
 * The trail to the current page. Below the sm breakpoint only the current page
 * shows, since the mark beside the sidebar trigger already says where you are.
 */
const RootBreadcrumbs = ({ items }: { items?: RootBreadcrumb[] }) => {
  if (!items?.length) {
    return <div className="min-w-0 flex-1" />;
  }

  const lastIndex = items.length - 1;

  return (
    <Breadcrumb aria-label="Breadcrumb" className="min-w-0 flex-1">
      <BreadcrumbList className="flex-nowrap text-sm">
        {items.map((item, index) => {
          const isLast = index === lastIndex;

          return (
            <React.Fragment key={`${item.href ?? ''}${item.label}`}>
              {index > 0 && (
                <BreadcrumbSeparator
                  className={cn(!isLast && 'hidden sm:inline-flex')}
                />
              )}
              <BreadcrumbItem
                className={cn('min-w-0', !isLast && 'hidden sm:inline-flex')}
              >
                {isLast || !item.href ? (
                  <BreadcrumbPage className="truncate">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    className="truncate"
                    render={<ShellLink href={item.href} />}
                  >
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
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
    </ShellLink>
  );
};

const SettingsLinkIcon = ({
  href,
  className,
}: {
  href: string;
  className?: string;
}) => {
  return (
    <LinkButton
      variant="ghost"
      href={href}
      size="icon-lg"
      aria-label="Settings"
      className={cn('shrink-0', className)}
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
      <ModeToggle
        variant="ghost"
        size="lg"
        className="shrink-0 hidden md:block"
      />
      {settingsHref && (
        <SettingsLinkIcon
          href={settingsHref}
          className="hidden md:inline-flex"
        />
      )}
      {children}
    </nav>
  );
};
