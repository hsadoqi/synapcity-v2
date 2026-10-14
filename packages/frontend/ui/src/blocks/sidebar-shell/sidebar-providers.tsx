'use client';

import * as React from 'react';
import { SidebarProvider } from '../../components/ui/sidebar';
import { TooltipProvider } from '../../components/ui/tooltip';

export const SidebarProviders = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <TooltipProvider>
      <SidebarProvider
        defaultOpen={false}
        className="min-h-svh max-w-screen size-full"
      >
        {children}
      </SidebarProvider>
    </TooltipProvider>
  );
};
