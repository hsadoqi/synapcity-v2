'use client';

import { useState, type ReactNode } from 'react';

import { UserRound } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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

type UserMenuProps = {
  name: string | null;
  email: string | null;
  imageUrl: string | null;
  children?: ReactNode;
};

function UserMenu({ name, email, imageUrl, children }: UserMenuProps) {
  const [open, setOpen] = useState(false);

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
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            {name && <span className="text-foreground">{name}</span>}
            {email && <span>{email}</span>}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        {children && <DropdownMenuSeparator />}
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { UserMenu };
export type { UserMenuProps };
