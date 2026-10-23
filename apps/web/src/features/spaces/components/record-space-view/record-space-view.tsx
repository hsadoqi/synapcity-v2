'use client';

import { useEffect } from 'react';

import { recordSpaceView } from '../../server/actions/space-state-actions';

/**
 * Notes that the person opened this space, once the page is on screen. It
 * renders nothing, and a view that cannot be saved is not reported.
 */
export function RecordSpaceView({ spaceId }: { spaceId: string }) {
  useEffect(() => {
    void recordSpaceView(spaceId);
  }, [spaceId]);

  return null;
}
