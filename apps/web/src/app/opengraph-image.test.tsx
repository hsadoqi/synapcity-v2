import { describe, expect, it } from 'vitest';

import { openGraphSize } from '@synapcity/frontend-site/open-graph';
import { site } from '@synapcity/frontend-site/site';

import OpenGraphImage, { alt, contentType, size } from './opengraph-image';

describe('opengraph-image route', () => {
  // Next reads these three exports statically, so they cannot be imported from
  // the shared card; this keeps the repeated literals from drifting.
  it('declares the shared card size, the site name and a PNG', () => {
    expect(size).toEqual(openGraphSize);
    expect(alt).toBe(site.name);
    expect(contentType).toBe('image/png');
  });

  it('renders the card to a PNG of the declared size', async () => {
    const response = OpenGraphImage();
    const png = new Uint8Array(await response.arrayBuffer());

    expect(response.headers.get('content-type')).toBe(contentType);
    // PNG signature, then the IHDR chunk's width and height.
    expect([...png.slice(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
    const view = new DataView(png.buffer);
    expect(view.getUint32(16)).toBe(size.width);
    expect(view.getUint32(20)).toBe(size.height);
  });
});
