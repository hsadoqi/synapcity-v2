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
  Pick<ButtonProps, 'variant' | 'size'> & { href: string };

const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(
  ({ variant, size, className, href, ...props }: LinkButtonProps) => {
    return (
      <Link
        className={cn(buttonVariants({ variant, size, ...props }), className)}
        href={href}
        {...props}
      />
    );
  },
);

export { LinkButton };
export type { LinkButtonProps };
