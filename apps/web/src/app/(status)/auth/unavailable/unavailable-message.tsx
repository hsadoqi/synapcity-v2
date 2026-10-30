'use client';

import { RouteErrorMessage } from '@/components/route-messages';

/**
 * What the proxy shows for a protected page while the Auth service
 * cannot be reached. Retry reloads the address the person asked for: a rewrite
 * keeps their URL, so the proxy asks again.
 */
export function UnavailableMessage() {
  return (
    <RouteErrorMessage
      variant="unavailable"
      retry={() => window.location.reload()}
    />
  );
}
