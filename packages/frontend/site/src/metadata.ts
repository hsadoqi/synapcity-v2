import type { Metadata } from 'next';
import { site } from './site';

type CreateMetadataInput = {
  /** Title of the app's home page. Defaults to the site name. */
  title?: string;
  /** Description of the app. Defaults to the site description. */
  description?: string;
  /**
   * The app's public URL (its `SITE_URL`). Next resolves relative metadata URLs,
   * such as the Open Graph image, against it. Left out, `metadataBase` stays
   * unset and Next warns at build; there is deliberately no default, so a wrong
   * address (such as localhost) can never reach a shared image URL silently.
   */
  siteUrl?: string;
};

/*
 * Root metadata for an app's layout. Child pages that set a plain string
 * `title` get "<title> | Synapcity" through the template. The Open Graph
 * image comes from the app's own `opengraph-image` file, so it is not set here.
 */
export function createMetadata({
  title = site.name,
  description = site.description,
  siteUrl,
}: CreateMetadataInput = {}): Metadata {
  return {
    ...(siteUrl ? { metadataBase: toMetadataBase(siteUrl) } : {}),
    title: { default: title, template: `%s | ${site.name}` },
    description,
    openGraph: {
      type: 'website',
      siteName: site.name,
      locale: site.locale,
      title,
      description,
    },
  };
}

function toMetadataBase(siteUrl: string): URL {
  let url: URL;
  try {
    url = new URL(siteUrl);
  } catch {
    throw new Error(`SITE_URL is not a valid URL: ${siteUrl}`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`SITE_URL must start with http:// or https://: ${siteUrl}`);
  }
  // Only the origin matters for resolving relative URLs.
  return new URL(url.origin);
}
