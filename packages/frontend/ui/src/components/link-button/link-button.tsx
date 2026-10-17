'use client';

import Link from 'next/link';
import type { LinkProps } from 'next/link';
import { buttonVariants } from '@synapcity/frontend-ui/core/button';
import type { ButtonProps } from '@synapcity/frontend-ui/core/button';
import { cn } from 'cn';
import React from 'react';

type NativeLinkProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
>;
type NextLinkProps = Omit<LinkProps, 'href'>;
type LinkButtonProps = NativeLinkProps &
  NextLinkProps &
  Pick<ButtonProps, 'variant' | 'size'> & { href: string; disabled?: boolean };
type LinkButtonVariant = LinkButtonProps['variant'];
type LinkButtonSize = LinkButtonProps['size'];
const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(
  ({ variant, size, className, href, disabled, onClick, ...props }, ref) => {
    return (
      <Link
        {...props}
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
      />
    );
  },
);
LinkButton.displayName = 'LinkButton';

export { LinkButton };
export type { LinkButtonProps, LinkButtonVariant, LinkButtonSize };
