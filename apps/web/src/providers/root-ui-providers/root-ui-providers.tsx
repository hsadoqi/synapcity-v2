'use client';

import { Suspense } from 'react';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';
import { Toaster } from '@synapcity/frontend-ui/core/toast';
import { NoticeToast } from '@/components/notices/notice-toast';

export const RootUiProviders = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    return (
        <TooltipProvider>
            {children}
            <Toaster limit={5} timeout={5000} />
            {/* useSearchParams needs a Suspense boundary or it opts the route out of
          static rendering. Nothing is shown while it waits. */}
            <Suspense fallback={null}>
                <NoticeToast />
            </Suspense>
        </TooltipProvider>
    );
};
