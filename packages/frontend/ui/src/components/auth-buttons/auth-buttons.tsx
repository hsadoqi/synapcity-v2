'use client';

import { usePathname } from 'next/navigation';
import { cn } from 'cn';

import { LinkButton } from '@synapcity/frontend-ui/next/link-button';
import type { LinkButtonProps } from '@synapcity/frontend-ui/next/link-button';

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
  signInHref,
  signUpHref,
  quietPathPrefix,
  variant = 'header',
  className,
}: {
  /** Where "Sign in" goes. The destination belongs to the consuming app. */
  signInHref: string;
  /** Where "Sign up" goes. The destination belongs to the consuming app. */
  signUpHref: string;
  /**
   * Header only. Under this path the form owns the one filled button, so the
   * links go quiet. Omit it and "Sign up" always stays the filled call to
   * action.
   */
  quietPathPrefix?: string;
  variant?: AuthButtonsVariant;
  className?: string;
}) {
  // Marks the link for the page already open, so assistive tech announces it.
  const pathname = usePathname();
  const current = (href: string) => (pathname === href ? 'page' : undefined);
  // On an auth page the form owns the one filled button, so the header links
  // go quiet: the link for the page already open is underlined, the other
  // stays plain. Elsewhere "Sign up" stays the filled call to action.
  const onAuthPage =
    variant === 'header' &&
    quietPathPrefix !== undefined &&
    Boolean(pathname?.startsWith(quietPathPrefix));
  const quiet = (href: string) =>
    current(href) ? ('selected' as const) : ('ghost' as const);

  return (
    <div
      data-slot="auth-buttons"
      data-variant={variant}
      className={cn('flex items-center gap-2', className)}
    >
      <LinkButton
        href={signInHref}
        aria-current={current(signInHref)}
        {...SIGN_IN[variant]}
        {...(onAuthPage ? { variant: quiet(signInHref) } : {})}
      >
        Sign in
      </LinkButton>
      <LinkButton
        href={signUpHref}
        aria-current={current(signUpHref)}
        {...SIGN_UP[variant]}
        {...(onAuthPage ? { variant: quiet(signUpHref) } : {})}
      >
        Sign up
      </LinkButton>
    </div>
  );
}

export { AuthButtons };
export type { AuthButtonsVariant };
