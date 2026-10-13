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
  ({ variant, size, className, href, disabled, onClick, ...props }, ref) => {
    return (
      <Link
        ref={ref}
        data-slot="link-button"
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : undefined}
        className={cn(buttonVariants({ variant, size }), className)}
        href={href}
        onClick={(event) => {
          if (disabled) {
            event.preventDefault();
            return;
          }
          onClick?.(event);
        }}
        {...props}
      />
    );
  },
);
LinkButton.displayName = 'LinkButton';

export { LinkButton };
export type { LinkButtonProps };
