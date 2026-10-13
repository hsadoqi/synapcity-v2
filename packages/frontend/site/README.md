# @synapcity/frontend-site

Owns: the facts the apps share about the site (name, description, language), the root `Metadata` builder, and the Open Graph card.

It owns no logo geometry (that is `SynapcityLogo` in `@synapcity/frontend-ui`), no theme tokens, and no page-specific titles or descriptions; each app passes its own. It sets no `metadataBase` or production URL, which waits on the deployment topology decision ([decisions index](../../../docs/architecture/decisions/README.md)).

## Entry points

| Import                                | Provides                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------ |
| `@synapcity/frontend-site/site`       | `site`: name, description, locale                                        |
| `@synapcity/frontend-site/metadata`   | `createMetadata({ title?, description? })`: root `Metadata` for a layout |
| `@synapcity/frontend-site/open-graph` | `OpenGraphCard`, `openGraphSize`: the social card and its size           |

## Using it in an app

```ts
// app/layout.tsx
export const metadata: Metadata = createMetadata({ title: 'Synapcity Docs' });
```

```tsx
// app/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export const alt = 'Synapcity';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(<OpenGraphCard />, size);
}
```

Each app declares `alt`, `size` and `contentType` itself: the Next docs show them as literal exports and do not say re-exporting them is supported.

## Rules

- No `next/og`, routing, request APIs, Server Actions or imports from `apps/*`. The only Next reference is the `Metadata` type, imported as a type ([workspace conventions](../../../docs/architecture/workspace-conventions.md)).
- Icons (`icon.svg`, `apple-icon.png`, `favicon.ico`) stay in each app's `app/` directory; Next only recognises them there. They are exports of the logo in `logo-mark.tsx`, as are the SVG string in `src/open-graph.tsx` and `apps/web/public/brand-assets`. `pnpm brand:check` (part of `pnpm verify`) fails when the SVGs drift from the geometry or the apps' icon files differ; it cannot check the PNG and ICO rasters, so re-export those by hand.
