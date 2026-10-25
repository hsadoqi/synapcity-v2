'use client';

import * as React from 'react';
import { SidebarProvider } from '@synapcity/frontend-ui/core/sidebar';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';

export const SidebarProviders = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <TooltipProvider>
      <SidebarProvider
        defaultOpen={false}
        className="h-svh w-full max-w-screen"
      >
        {children}
      </SidebarProvider>
    </TooltipProvider>
  );
};
