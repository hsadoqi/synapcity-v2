'use client';

import { useState, useTransition, type ReactNode } from 'react';

import { BellIcon, HomeIcon, LogOutIcon, UserRound } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { LinkButton } from './link-button';

type UserMenuProps = {
  id: string;
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
  id,
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
                    toggle
                    pressed={open}
                    data-slot="user-menu-trigger"
                    variant="ghost"
                    size="icon-xl"
                    label="Account menu"
                  />
                }
              />
            }
          >
            <Avatar>
              {/* TODO: Add dark mode/light mode versions for the default image/avatar */}
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
          <DropdownMenuLabel className="flex flex-col justify-start gap-0.5">
            {name && <span className="text-xs text-foreground">{name}</span>}
            {email && <span className="text-xs text-foreground">{email}</span>}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        {children ? <DropdownMenuSeparator /> : null}
        {children}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <LinkButton
              href={`/${id}/home`}
              variant="ghost"
              size="icon"
              aria-label="Home"
              className="w-full justify-start bg-transparent items-center hover:bg-transparent focus:bg-transparent active:bg-transparent focus:text-foreground gap-2 transition-all duration-200 ease-in-out"
            >
              <HomeIcon />
              Home
            </LinkButton>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <LinkButton
              href={`/${id}/settings`}
              variant="ghost"
              size="icon"
              aria-label="Settings"
              className="w-full justify-start bg-transparent items-center hover:bg-transparent focus:bg-transparent active:bg-transparent focus:text-foreground gap-2 transition-all duration-200 ease-in-out"
            >
              <BellIcon />
              Settings
            </LinkButton>
          </DropdownMenuItem>
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
