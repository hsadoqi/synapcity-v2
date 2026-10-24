'use client';

import {
  configureLookCookie,
  ModeProvider,
} from '@synapcity/frontend-preferences';

// One parent domain lets docs show the look chosen in the web app; unset keeps it host-only.
configureLookCookie({
  domain: process.env.NEXT_PUBLIC_PREFERENCES_COOKIE_DOMAIN,
});

export default function RootProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      shareLook
    >
      {children}
    </ModeProvider>
  );
}
