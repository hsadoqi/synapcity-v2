'use client';

import { cn } from '@synapcity/frontend-ui/lib/utils';
import { LinkButton } from '@synapcity/frontend-ui/next/link-button';

const MAIN_CONTENT_ID = 'main-content';

export const SkipLinkButton = () => {
  return (
    <LinkButton
      href={`#${MAIN_CONTENT_ID}`}
      variant="default"
      className={cn(
        'fixed top-4 left-4 z-50 -translate-y-24 focus-visible:translate-y-0',
      )}
      // A client-side hash change scrolls but leaves focus on the link, so the
      // next Tab would go back through the navigation. Move focus to <main>
      // (tabIndex -1) so keyboard and screen-reader users land in the page.
      onClick={() => {
        document.getElementById(MAIN_CONTENT_ID)?.focus();
      }}
    >
      Skip to main content
    </LinkButton>
  );
};
