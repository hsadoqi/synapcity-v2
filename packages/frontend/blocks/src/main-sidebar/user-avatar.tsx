'use client';

import { DropdownActionsMenu } from './dropdown-actions';
import { UserAvatarContent } from './user-avatar-content';
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
  const content = <UserAvatarContent user={user} />;

  if (actions?.length === 0) return content;

  return <DropdownActionsMenu showLabel label={user.name} trigger={content} />;
};
