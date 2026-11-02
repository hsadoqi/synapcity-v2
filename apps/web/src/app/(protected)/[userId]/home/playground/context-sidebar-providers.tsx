'use client';

import type { ReactNode } from 'react';
import { UiProviders } from './ui-providers';

export function ContextSidebarProviders({ children }: { children: ReactNode }) {
  return <UiProviders>{children}</UiProviders>;
}
