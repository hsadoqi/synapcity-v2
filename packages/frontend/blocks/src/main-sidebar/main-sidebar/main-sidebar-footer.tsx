'use client';

import type { ReactNode } from 'react';
import {
  SidebarFooter,
  SidebarSeparator,
} from '@synapcity/frontend-ui/core/sidebar';

/** The panel footer is a slot so account or action ownership stays with the host. */
export function MainSidebarFooter({ children }: { children: ReactNode }) {
  return (
    <SidebarFooter>
      <SidebarSeparator className="mx-0" />
      {children}
    </SidebarFooter>
  );
}
