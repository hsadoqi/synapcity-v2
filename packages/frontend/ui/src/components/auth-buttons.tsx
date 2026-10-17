'use client';

import { usePathname } from 'next/navigation';
import { cn } from 'cn';

import { LinkButton } from './link-button';
import type { LinkButtonProps } from './link-button';

type AuthButtonsVariant = 'header' | 'hero';

const SIGN_IN: Record<
  AuthButtonsVariant,
  Pick<LinkButtonProps, 'variant' | 'size'>
> = {
  header: { variant: 'ghost', size: 'sm' },
  hero: { variant: 'outline', size: 'lg' },
};

const SIGN_UP: Record<
  AuthButtonsVariant,
  Pick<LinkButtonProps, 'variant' | 'size'>
> = {
  header: { variant: 'default', size: 'sm' },
  hero: { variant: 'default', size: 'lg' },
};

function AuthButtons({
  variant = 'header',
  className,
}: {
  variant?: AuthButtonsVariant;
  className?: string;
}) {
  // Marks the link for the page already open, so assistive tech announces it.
  const pathname = usePathname();
  const current = (href: string) => (pathname === href ? 'page' : undefined);
  // On an auth page the form owns the one filled button, so the header links
  // go quiet: the link for the page already open is underlined, the other
  // stays plain. Elsewhere "Sign up" stays the filled call to action.
  const onAuthPage = variant === 'header' && pathname?.startsWith('/auth');
  const quiet = (href: string) =>
    current(href) ? ('selected' as const) : ('ghost' as const);

  return (
    <div
      data-slot="auth-buttons"
      data-variant={variant}
      className={cn('flex items-center gap-2', className)}
    >
      <LinkButton
        href="/auth/login"
        aria-current={current('/auth/login')}
        {...SIGN_IN[variant]}
        {...(onAuthPage ? { variant: quiet('/auth/login') } : {})}
      >
        Sign in
      </LinkButton>
      <LinkButton
        href="/auth/register"
        aria-current={current('/auth/register')}
        {...SIGN_UP[variant]}
        {...(onAuthPage ? { variant: quiet('/auth/register') } : {})}
      >
        Sign up
      </LinkButton>
    </div>
  );
}

export { AuthButtons };
export type { AuthButtonsVariant };
