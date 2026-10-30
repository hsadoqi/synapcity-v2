'use client';

import {
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenu,
  DropdownMenuTrigger,
} from '@synapcity/frontend-ui/core/dropdown-menu';
import {
  Sparkles,
  BadgeCheck,
  CreditCard,
  Bell,
  LogOut,
  LucideIcon,
  CheckIcon,
} from 'lucide-react';
import React from 'react';
import type { User } from '@synapcity/domain-identity';
import { UserAvatar } from './user-avatar';
import { useIsMobile } from '@synapcity/frontend-ui/hooks/use-mobile';
import { cn } from 'cn';

export type MenuGroupItem = Omit<MenuItem, 'label'> & {
  heading?: string;
  items?: MenuItem[];
};

export type MenuItem = {
  label?: string;
  href?: string;
  onAction?: string;
  icon?: string | LucideIcon | React.ComponentType;
  className?: string;
  isActive?: boolean;
};

export const defaultActionItems: MenuGroupItem[] = [
  {
    heading: 'billing',
    className: 'sr-only',
    items: [
      {
        label: 'Upgrade to Pro',
        icon: Sparkles,
      },
    ],
  },
  {
    heading: 'account',
    className: 'sr-only',
    items: [
      {
        label: 'Account',
        icon: BadgeCheck,
      },
      {
        label: 'Billing',
        icon: CreditCard,
      },
      {
        label: 'Notifications',
        icon: Bell,
      },
    ],
  },
  {
    heading: 'auth',
    className: 'sr-only',
    items: [
      {
        label: 'Log Out',
        icon: LogOut,
      },
    ],
  },
];

type DropdownActionsMenuProps = React.HTMLAttributes<HTMLElement> & {
  showChecked?: boolean;
  showLabel?: boolean;
  label?: React.ReactNode;
  children?: React.ReactNode;
  trigger?: React.ReactElement;
  user?: User;
  className?: string;
};

export const DropdownActionsMenu = ({
  showLabel = false,
  label,
  children,
  trigger,
  user,
  showChecked = false,
  className,
}: DropdownActionsMenuProps) => {
  const isMobile = useIsMobile();
  return (
    <DropdownMenu>
      {children ?? <DropdownMenuTrigger render={trigger} />}
      <DropdownMenuContent
        className={cn(
          '{w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg',
          className,
        )}
        side={isMobile ? 'bottom' : 'right'}
        align={'end'}
        sideOffset={4}
      >
        {label ?? (showLabel && <DropdownActionsMenuLabel user={user} />)}
        <DropdownMenuSeparator />
        {defaultActionItems.map((group) => (
          <DropdownMenuGroup className={group.className}>
            {group.heading && (
              <DropdownMenuLabel>{group.heading}</DropdownMenuLabel>
            )}
            {group.items?.map(({ icon, className, label, ...item }) => (
              <DropdownMenuItem className={className} {...item}>
                {icon && typeof icon !== 'string' && React.createElement(icon)}
                {label}
                {item.isActive && showChecked ? (
                  <CheckIcon className="ml-auto size-3.5" aria-hidden="true" />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const DropdownActionsMenuLabel = ({
  user,
  children,
}: {
  children?: React.ReactNode;
  user?: User;
}) => (
  <DropdownMenuLabel className="p-0 font-normal">
    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
      {children}
      {user && (
        <>
          <UserAvatar user={user} />
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="truncate text-xs">{user.email}</span>
          </div>
        </>
      )}
    </div>
  </DropdownMenuLabel>
);
