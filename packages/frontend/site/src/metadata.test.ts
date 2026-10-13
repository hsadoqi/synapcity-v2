import { describe, expect, it } from 'vitest';

import { createMetadata } from './metadata';
import { site } from './site';

describe('createMetadata', () => {
  it('falls back to the site name and description', () => {
    const metadata = createMetadata();

    expect(metadata.description).toBe(site.description);
    expect(metadata.title).toEqual({
      default: site.name,
      template: `%s | ${site.name}`,
    });
  });

  it('uses the given title and description for the page and Open Graph', () => {
    const metadata = createMetadata({ title: 'Docs', description: 'Read me' });

    expect(metadata.openGraph).toMatchObject({
      siteName: site.name,
      title: 'Docs',
      description: 'Read me',
    });
  });

  it('leaves metadataBase unset until a production domain exists', () => {
    expect(createMetadata().metadataBase).toBeUndefined();
  });
});
