'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@synapcity/frontend-ui/core/avatar';
import { DropdownActionsMenu } from './dropdown-actions';
import type { User } from '@synapcity/domain-identity';

export type UserAction = {
  label: string;
  icon?: string;
  onAction?: (props: any) => void;
};
export const UserAvatar = ({
  user,
  actions,
}: {
  user: User;
  actions?: UserAction[];
}) => {
  const defaultAvatar = `https://stock.adobe.com/search?k=default+avatar`;
  const image = user.avatar ?? defaultAvatar;
  const content = (
    <span className="@container/avatar">
      <Avatar>
        <AvatarImage src={image} alt={`${user.name}'s avatar`} />
        <AvatarFallback>{}</AvatarFallback>
      </Avatar>
      <span className="hidden @md/avatar:grid min-w-0 flex-1 text-left leading-tight">
        <span className="truncate text-sm font-medium">{user.name}</span>
        {user.email && (
          <span className="text-sidebar-foreground/70 truncate text-xs">
            {user.email}
          </span>
        )}
      </span>
    </span>
  );

  if (actions?.length === 0) return content;

  return <DropdownActionsMenu showLabel label={user.name} trigger={content} />;
};
