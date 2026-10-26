'use client';

import { useState, useTransition, type ReactNode } from 'react';
import Link from 'next/link';

import { Cog, HomeIcon, LogOutIcon, UserRound } from 'lucide-react';

import type { AccountLinks } from '@synapcity/frontend-ui/lib/account-links';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@synapcity/frontend-ui/core/avatar';
import { Button } from '@synapcity/frontend-ui/core/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@synapcity/frontend-ui/core/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@synapcity/frontend-ui/core/tooltip';

type UserMenuProps = AccountLinks & {
  name: string | null;
  email: string | null;
  imageUrl: string | null;
  children?: ReactNode;
  /**
   * Ends the session. The app owns how (a server action), so this package
   * stays free of app imports. The item is not rendered without it, rather
   * than shown as a control that does nothing.
   */
  onSignOut?: () => void | Promise<void>;
};

function UserMenu({
  homeHref,
  settingsHref,
  name,
  email,
  imageUrl,
  children,
  onSignOut,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  // A transition, so a server action's redirect() is handled by React/Next
  // and the item can show a pending state.
  const [signingOut, startSigningOut] = useTransition();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip disabled={open}>
          <TooltipTrigger
            render={
              <DropdownMenuTrigger
                render={
                  <Button
                    data-slot="user-menu-trigger"
                    variant="ghost"
                    size="icon-xl"
                    label="Account menu"
                    tooltip={false}
                  />
                }
              />
            }
          >
            <Avatar>
              {imageUrl && <AvatarImage src={imageUrl} alt="" />}
              {/* An icon, not initials: visible text in this button would have to be
              part of its accessible name (WCAG 2.5.3), and axe flags it. */}
              <AvatarFallback>
                <UserRound aria-hidden />
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>Account menu</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col items-start gap-1">
            {name && (
              <span className="font-ui text-sm text-foreground">{name}</span>
            )}
            {email && (
              <span className="max-w-full truncate font-ui text-xs text-muted-foreground">
                {email}
              </span>
            )}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        {children ? <DropdownMenuSeparator /> : null}
        {children}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLinkItem render={<Link href={homeHref} />}>
            <HomeIcon aria-hidden />
            Home
          </DropdownMenuLinkItem>
          <DropdownMenuLinkItem render={<Link href={settingsHref} />}>
            <Cog aria-hidden />
            Settings
          </DropdownMenuLinkItem>
        </DropdownMenuGroup>
        {onSignOut ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={signingOut}
              onClick={() => startSigningOut(onSignOut)}
            >
              <LogOutIcon aria-hidden />
              {signingOut ? 'Signing out…' : 'Sign out'}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { UserMenu };
export type { UserMenuProps };
