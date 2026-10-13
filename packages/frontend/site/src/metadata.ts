import type { Metadata } from 'next';
import { site } from './site';

type CreateMetadataInput = {
  /** Title of the app's home page. Defaults to the site name. */
  title?: string;
  /** Description of the app. Defaults to the site description. */
  description?: string;
};

/*
 * Root metadata for an app's layout. Child pages that set a plain string
 * `title` get "<title> | Synapcity" through the template. The Open Graph
 * image comes from the app's own `opengraph-image` file, so it is not set here.
 */
export function createMetadata({
  title = site.name,
  description = site.description,
}: CreateMetadataInput = {}): Metadata {
  return {
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
