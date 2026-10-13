import { ImageResponse } from 'next/og';
import { OpenGraphCard } from '@synapcity/frontend-site/open-graph';

// Next only picks this file up inside the app, so the wiring repeats per app;
// the card itself is shared. See packages/frontend/site/README.md.
export const alt = 'Synapcity';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(<OpenGraphCard />, size);
}
