'use client';

import { ModeProvider } from '@synapcity/frontend-preferences';

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
