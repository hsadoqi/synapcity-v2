import { cn } from '@synapcity/frontend-ui/lib/utils';
import {
  LinkButton,
  type LinkButtonSize,
  type LinkButtonVariant,
} from '@synapcity/frontend-ui/next/link-button';

type AuthType = 'login' | 'register' | 'forgot-password' | 'update-password';

interface AuthButtonProps {
  type?: AuthType;
  label?: string;
  size?: LinkButtonSize;
  variant?: LinkButtonVariant;
  buttonClassName?: string;
  className?: string;
  /** A safe post-sign-in destination, carried across to the other auth page. */
  next?: string;
}

const authTypeToPath: Record<AuthType, string> = {
  login: '/auth/login',
  register: '/auth/register',
  'forgot-password': '/auth/forgot-password',
  'update-password': '/auth/update-password',
};

export const AuthLinkButton = ({
  type = 'login',
  label = 'Back to sign in',
  size = 'sm',
  variant = 'link',
  buttonClassName,
  className,
  next,
}: AuthButtonProps) => {
  const href = next
    ? `${authTypeToPath[type]}?next=${encodeURIComponent(next)}`
    : authTypeToPath[type];

  return (
    <div className={cn('flex flex-1 justify-center', className)}>
      <LinkButton
        href={href}
        variant={variant}
        size={size}
        className={buttonClassName}
      >
        {label}
      </LinkButton>
    </div>
  );
};
