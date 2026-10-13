'use client';

import Link from 'next/link';
import { buttonVariants } from './ui/button';
import type { ButtonProps } from './ui/button';
import { cn } from 'cn';
import React from 'react';

type NativeLinkProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
>;
type NextLinkProps = Omit<React.ComponentProps<typeof Link>, 'href'>;
type LinkButtonProps = NativeLinkProps &
  NextLinkProps &
  Pick<ButtonProps, 'variant' | 'size'> & { href: string; disabled?: boolean };

const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(
  ({ variant, size, className, href, disabled, ...props }: LinkButtonProps) => {
    return (
      <Link
        ref={disabled ? null : undefined}
        data-slot="link-button"
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : undefined}
        className={cn(buttonVariants({ variant, size, ...props }), className)}
        href={href}
        {...props}
      />
    );
  },
);

export { LinkButton };
export type { LinkButtonProps };
