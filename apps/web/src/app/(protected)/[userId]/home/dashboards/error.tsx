'use client';

import { CollectionLoadError } from '@/components/route-messages';

/**
 * When the dashboards page fails to load. Sits inside the home layout, so the
 * shell and its navigation stay; the root boundary would replace them.
 */
export default function DashboardsError(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <CollectionLoadError collection="dashboards" {...props} />;
}
