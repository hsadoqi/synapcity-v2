'use client';

import { PublicShell } from '@synapcity/frontend-shells';

import { RouteErrorMessage } from '@/components/route-messages';

/**
 * The last boundary for an unexpected error. Next puts it above every route
 * group's layout, so it replaces whichever shell was showing and brings the
 * public one (logo and theme control, no account menu: a client component
 * cannot render the server-read one). `(protected)` has its own boundary that
 * keeps the workspace shell. It cannot catch an error in the root layout
 * itself; that needs `global-error`.
 */
export default function RouteError(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <PublicShell>
      <RouteErrorMessage {...props} />
    </PublicShell>
  );
}
