'use client';

import { Suspense } from 'react';
import {
  configureLookCookie,
  ModeProvider,
} from '@synapcity/frontend-preferences';
import { Toaster } from '@synapcity/frontend-ui/core/toast';

import { NoticeToast } from '@/components/notices/notice-toast';
import { ErrorReports } from '@/features/error-reports/client';

// One parent domain lets web and docs show the same look; unset keeps it host-only.
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
      disableTransitionOnChange
      shareLook
    >
      {children}
      {/* No manager prop: Toaster uses the shared `toast`, so any module can call
          toast.add(...) and reach this one viewport. */}
      <Toaster limit={5} timeout={5000} />
      {/* useSearchParams needs a Suspense boundary or it opts the route out of
          static rendering. Nothing is shown while it waits. */}
      <Suspense fallback={null}>
        <NoticeToast />
      </Suspense>
      {/* Loads nothing unless the person has turned error reports on. */}
      <ErrorReports />
    </ModeProvider>
  );
}
