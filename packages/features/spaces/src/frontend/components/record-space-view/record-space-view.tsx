'use client';

import { useEffect } from 'react';

/**
 * Notes that the person opened this space, once the page is on screen. It
 * renders nothing, and a view that cannot be saved is not reported.
 */
export function RecordSpaceView({
  spaceId,
  recordSpaceView,
}: {
  spaceId: string;
  /** The host's view action. */
  recordSpaceView: (spaceId: string) => Promise<void>;
}) {
  useEffect(() => {
    void recordSpaceView(spaceId);
  }, [spaceId, recordSpaceView]);

  return null;
}
