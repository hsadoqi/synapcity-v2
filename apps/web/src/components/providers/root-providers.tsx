'use client';

import { Suspense } from 'react';
import { ModeProvider } from '@synapcity/frontend-ui/providers/mode-provider';
import { Toaster } from '@synapcity/frontend-ui/core/toast';

import { NoticeToast } from '@/components/notices/notice-toast';
import { ErrorReports } from '@/features/error-reports/client';

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
