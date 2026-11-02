import { useMediaQuery } from './use-media-query';

const MOBILE_BREAKPOINT = 768;
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

/**
 * Whether the viewport is below the mobile breakpoint, following resizes. The
 * server cannot know the viewport, so it renders the desktop layout.
 */
export function useIsMobile() {
  return useMediaQuery(QUERY);
}
