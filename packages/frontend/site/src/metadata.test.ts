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

  it('leaves metadataBase unset when no site URL is given', () => {
    expect(createMetadata().metadataBase).toBeUndefined();
    expect(createMetadata({ siteUrl: '' }).metadataBase).toBeUndefined();
    expect(createMetadata({ siteUrl: undefined }).metadataBase).toBeUndefined();
  });

  it('sets metadataBase to the origin of the site URL', () => {
    expect(
      createMetadata({ siteUrl: 'https://app.example.com' }).metadataBase,
    ).toEqual(new URL('https://app.example.com'));
  });

  it('drops a path, query and trailing slash from the site URL', () => {
    const base = createMetadata({
      siteUrl: 'https://app.example.com/docs/?x=1#top',
    }).metadataBase;
    expect(String(base)).toBe('https://app.example.com/');
  });

  it('keeps a port', () => {
    expect(
      String(createMetadata({ siteUrl: 'http://localhost:8080' }).metadataBase),
    ).toBe('http://localhost:8080/');
  });

  it.each(['localhost:8080', 'not a url'])(
    'throws a message naming SITE_URL for %s',
    (siteUrl) => {
      expect(() => createMetadata({ siteUrl })).toThrow(/SITE_URL/);
    },
  );

  it.each(['ftp://example.com', 'javascript:alert(1)'])(
    'refuses the %s scheme',
    (siteUrl) => {
      expect(() => createMetadata({ siteUrl })).toThrow(
        /http:\/\/ or https:\/\//,
      );
    },
  );

  it('does not change anything else when a site URL is given', () => {
    const { metadataBase, ...rest } = createMetadata({
      siteUrl: 'https://app.example.com',
    });
    expect(metadataBase).toBeDefined();
    expect(rest).toEqual(createMetadata());
  });
});
