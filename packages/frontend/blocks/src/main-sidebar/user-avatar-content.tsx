import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@synapcity/frontend-ui/core/avatar';
import type { User } from '@synapcity/domain-identity';

/** The avatar and name on their own, without the actions menu. */
export const UserAvatarContent = ({ user }: { user: User }) => {
  const defaultAvatar = `https://stock.adobe.com/search?k=default+avatar`;
  const image = user.avatar ?? defaultAvatar;
  return (
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
};
