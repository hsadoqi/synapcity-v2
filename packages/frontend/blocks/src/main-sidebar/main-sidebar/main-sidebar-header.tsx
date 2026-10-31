'use client';

import type { ReactNode } from 'react';
import { SidebarHeader } from '@synapcity/frontend-ui/core/sidebar';

export function MainSidebarHeader({
  label,
  action,
}: {
  label: string;
  action?: ReactNode;
}) {
  return (
    <SidebarHeader className="flex-row items-center">
      <span className="min-w-0 flex-1 truncate px-2 text-sm font-medium">
        {label}
      </span>
      {action}
    </SidebarHeader>
  );
}
