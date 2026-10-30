import type { Metadata } from 'next';

import { UnavailableMessage } from './unavailable-message';

export const metadata: Metadata = {
  title: 'Sign-in service unavailable',
  robots: { index: false, follow: false },
};

/** Rendered by the proxy's 503 rewrite (`AUTH_UNAVAILABLE_PATH`); not linked from anywhere. */
export default function UnavailablePage() {
  return <UnavailableMessage />;
}
