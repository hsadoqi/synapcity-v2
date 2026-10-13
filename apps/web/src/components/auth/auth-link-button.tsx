import { cn } from '@/lib/utils';
import {
  LinkButton,
  type LinkButtonSize,
  type LinkButtonVariant,
} from '@synapcity/frontend-ui/components/link-button';
import { LogoutButton } from './logout-button';

type AuthType =
  'login' | 'register' | 'forgot-password' | 'update-password' | 'logout';

interface AuthButtonProps {
  type?: AuthType;
  label?: string;
  size?: LinkButtonSize;
  variant?: LinkButtonVariant;
  buttonClassName?: string;
  className?: string;
}

const authTypeToPath: Record<AuthType, string> = {
  login: '/auth/login',
  register: '/auth/register',
  'forgot-password': '/auth/forgot-password',
  'update-password': '/auth/update-password',
  logout: '/auth/logout',
};

export const AuthLinkButton = ({
  type = 'login',
  label = 'Back to sign in',
  size = 'sm',
  variant = 'link',
  buttonClassName,
  className,
}: AuthButtonProps) => {
  if (type === 'logout') {
    return <LogoutButton />;
  }

  return (
    <nav className={cn('flex justify-center flex-1', className)}>
      <LinkButton
        href={authTypeToPath[type]}
        variant={variant}
        size={size}
        className={buttonClassName}
      >
        {label}
      </LinkButton>
    </nav>
  );
};
