'use client';

import { ModeProvider } from '@synapcity/frontend-ui/providers/mode-provider';

export default function RootProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ModeProvider>
  );
}
