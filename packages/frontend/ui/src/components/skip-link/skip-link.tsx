'use client';

import { cn } from '@synapcity/frontend-ui/lib/utils';
import { LinkButton } from '@synapcity/frontend-ui/next/link-button';

export const SkipLinkButton = () => {
  return (
    <LinkButton
      href="#main-content"
      variant="default"
      className={cn(
        'fixed top-4 left-4 z-50 -translate-y-24 focus-visible:translate-y-0',
      )}
    >
      Skip to main content
    </LinkButton>
  );
};
