# @synapcity/frontend-tokens

Status: **candidate**. This package is being evaluated to merge with or replace [`frontend-tailwind-config`](../tailwind-config/README.md). It is not adopted: `frontend-tailwind-config` still owns tokens ([ADR-0002](../../../docs/architecture/decisions/0002-styling-foundation.md)), and font roles still follow [ADR-0003](../../../docs/architecture/decisions/0003-typography-roles-and-font-preferences.md). Adopting it means amending both records.

Owns: the Precision Canvas token values (colour ramps and light and dark planes, type ladder, spacing, layout, radius, elevation, motion), the base element rules that use them, self-hosted Inter and JetBrains Mono, and a Tailwind v4 theme bridge. The files come from the Claude Design export.

## Exports

| Export                 | Contains                                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `./tokens.css`         | `src/index.css`: every token file and `base.css`. Token variables are unlayered; the element rules in `base.css` sit in `@layer base` |
| `./tailwind-theme.css` | Maps the tokens to Tailwind colours and scales. Nothing imports it yet, so no `bg-*` or `text-*` utility reads these tokens today     |

## How it reaches the app today

`@synapcity/frontend-ui/styles.css` imports `tokens.css` after `@synapcity/frontend-tailwind-config`, so `apps/web` and Storybook load it once through that file.

Because the token variables are unlayered and load last, they override the existing values wherever names overlap. In the files `tokens.css` loads, 32 names overlap:

- On `:root`, so always: the `--primary-50` to `--primary-950` and `--accent-50` to `--accent-950` ramps, and `--radius-xs` to `--radius-xl`.
- On `.light` and `.dark` only: `--background`, `--foreground`, `--info-foreground`, `--success-foreground` and `--warning-foreground`. `apps/web` runs `next-themes` with `attribute="class"`, which sets one of the two on `<html>` before first paint, so in practice these apply too.

`--sidebar`, `--link` and `--divider` are no longer redeclared here. Overriding them made the light sidebar a heavy grey (the email in its account row fell to 4.20:1), turned links violet against the achromatic default, and made shell dividers white on white. `frontend-tailwind-config` owns them until the merge. The light plane's own `--surface-hover`, `--surface-active` and `--border-*` values are dark-on-light; they had been copied from the dark plane as white alphas, which disappear on a light surface.

`tailwind-theme.css` overlaps on 35 more `--color-*` names, but nothing loads it.

## Decisions for the merge

- **Body font and size.** The export set `body` to `var(--font-sans)` at 13px with a fixed 20px line height. That replaced the existing `font-body text-base`, so the text size preference and a body font chosen through `--font-preference-body` (ADR-0003) stopped reaching body text, and `apps/web/e2e/text-size.e2e.ts` failed. Those three declarations are removed until the merge decides how the 13px UI scale and the preferences fit together. The export's `min-height: 100vh` is removed too, so the existing `min-h-svh` applies; on phones `100vh` can be taller than the visible screen.
- **Links.** The export coloured every bare link with `--link` and removed its underline: 2.03:1 against body text, so colour alone marked a link (WCAG 1.4.1) and Storybook's axe check failed. Links now take the surrounding text colour and show `--link` (the accent: 6.78:1 in light, 8.72:1 in dark) with an underline on hover. A link class such as `text-*` or `underline` still wins, since the rule sits in the base layer.
- **Fonts.** The self-hosted Inter and JetBrains Mono load alongside the `next/font` Inter, Geist and Geist Mono that [`frontend-fonts`](../fonts/README.md) loads for every host. ADR-0003 names Geist Mono for code. The Inter file here is byte-identical to the latin subset `next/font` serves, and its `@font-face` has no `unicode-range`: when it comes after `next/font`'s faces in the cascade (a layout that imports the fonts before the stylesheet) the browser downloads it as well. Removing it, or the pair, is part of this merge decision.
- **One owner.** The overlapping names need one source. Either this package replaces the values in `frontend-tailwind-config/tokens/utilities.css`, or the two are merged into one package.
- **Theme bridge.** `tailwind-theme.css` repeats mappings that `shared-styles.css` already defines under `@theme inline`. Pick one.

## Scripts

`check-types`, `test`, `test:coverage`. `src/tokens.test.ts` checks that `index.css` imports every token file, that every `url()` points at a file that exists, that the exports exist, and that the element rules stay in the base layer.
