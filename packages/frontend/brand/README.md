# @synapcity/frontend-brand

Owns: the Synapcity brand geometry (mark grid, wordmark and logo outlines), the React brand components (`SynapcityMark`, `SynapcityWordmark`, `SynapcityLogo`), server-safe SVG strings built from that geometry, the canonical static SVG exports in `assets/`, and the list of canonical file names and compatibility aliases.

It owns no site name, description, locale or metadata policy (`@synapcity/frontend-site`), no product positioning, no theme tokens, no font loading or font files, no route metadata, and no application layout. It changes no logo design: the geometry here is the shipped geometry, pinned by `src/geometry.test.ts`, and a change to it needs the owner's approval ([PRODUCT.md](../../../PRODUCT.md), "Brand commitments").

## Entry points

| Import                                 | Provides                                                                                                                                  |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `@synapcity/frontend-brand/geometry`   | Numbers and outlines (`MARK_GRID`, `WORDMARK_PATH`, ...); no imports, any runtime                                                         |
| `@synapcity/frontend-brand/svg`        | Server-safe SVG strings: `logoSvg(ink)`, `wordmarkSvg(ink)`, `markSvg(ink)`, the adaptive variants and `appIconSvg()`; no React, no hooks |
| `@synapcity/frontend-brand/manifest`   | `canonicalAssets`, `webPublicFiles`, `storybookAliases`, `appIcon`: file names and exact contents; no file system access                  |
| `@synapcity/frontend-brand/react`      | The three components and their types; draw in `currentColor`; `title={null}` makes one decorative                                         |
| `@synapcity/frontend-brand/assets/<f>` | The canonical `.svg` files                                                                                                                |

## Where the brand reaches each host

```text
src/geometry.ts ──► src/svg.ts ──► src/manifest.ts ──► assets/*.svg            canonical, committed
                                                    ├─► apps/web/public/brand-assets/*       stable public URLs
                                                    ├─► apps/storybook/public/brand-assets/*   aliases
                                                    ├─► apps/{web,docs}/src/app/icon.svg     Next metadata file
                                                    └─► public/ (root)                       legacy copies, see below
src/geometry.ts ──► src/react/       components for the apps
src/svg.ts      ──► @synapcity/frontend-site/open-graph    social card
```

Everything on the right of `assets/` is a generated or copied output, not a source. Change the geometry, then run:

```sh
pnpm brand:sync    # writes every output from this package; idempotent
pnpm brand:check   # fails on any missing, stale, stray or hand-copied file
```

`pnpm brand:check` compares exact bytes, fails on unexpected files in the brand directories and on any other file carrying a copy of the outlines, and names the canonical source in each failure. It is part of `pnpm verify`.

## Hosts

- **Web public URLs** (`apps/web/public/brand-assets`): `logo.svg`, `logo-monochrome.svg`, `mark-dark.svg`, `mark-light.svg`, `wordmark.svg`, `wordmark-monochrome.svg`. These URLs are public and stay as they are; the files are outputs.
- **Next metadata files** stay in each app's `src/app` (`icon.svg`, `apple-icon.png`, `favicon.ico`); Next only recognises them there. `icon.svg` is generated. The PNG and ICO have no generator (it would need a rasteriser dependency, which needs approval), so `brand:check` verifies that the apps' copies are byte-identical, the format and dimensions (180x180 PNG; ICO with 16, 32 and 48), and a recorded checksum, but it cannot prove they were drawn from the geometry. Update the checksum in `scripts/brand-assets-lib.mjs` only with an intentional change.
- **Storybook** is a host, not a second owner. `.storybook/main.ts` serves `assets/` at `/brand-assets`, and `apps/storybook/public/brand-assets` holds only generated compatibility aliases for names Storybook served before this package: `logo-dark.svg` (dark ink for a light background) and `wordmark-dark.svg` are the monochrome files, `logo-light.svg` and `wordmark-light.svg` the adaptive ones. `logo-on-dark.svg` (fixed light ink for a dark background) is canonical. The manager picks `logo-dark.svg` or `logo-on-dark.svg` by Storybook's own theme mode, never by the operating-system colour scheme. Its `public/favicon.ico` is the tab icon; its former `icon.svg` and `apple-icon.png` were removed after the built HTML and a browser session requested neither.
- **Root `public/`**: kept. No checked-in file serves it (no root `vercel.json`, no workflow or script reads it, and the three Vercel projects `synapcity`, `synapcity-docs` and `synapcity-storybook` each have a `vercel.json` under `apps/`), but a project's Root Directory is a Vercel setting, and the team that owns those projects (`hanaa-sadoqis-projects`) is not reachable from the CLI account available here. The files are outputs, covered by `brand:check`. Remove the directory, and its entries in `scripts/brand-assets-lib.mjs`, once the owner confirms from the Vercel dashboard that no project's Root Directory is the repository root and nothing links to its URLs.

## Compatibility

`@synapcity/frontend-ui/components/logo-mark` still works: it re-exports `@synapcity/frontend-brand/react` and exists only for consumers that have not moved. It is transitional; remove it with its story and test once no workspace consumer imports it. `@synapcity/frontend-shells` imports this package directly.

## Rules

- No Next, routing, request APIs or imports from `apps/*`.
- The Open Graph card must not import the React components (hooks do not run in the image renderer, and Next rejects `react-dom/server` in a route); it uses `@synapcity/frontend-brand/svg`.
- `geometry.ts`, `svg.ts` and `manifest.ts` stay runtime-neutral: the repository scripts read them directly with Node.
