'use client';

import type { ReactNode } from 'react';
import { Toaster } from '@synapcity/frontend-ui/core/toast';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';

export function UiProviders({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      {children}
      <Toaster />
    </TooltipProvider>
  );
}
