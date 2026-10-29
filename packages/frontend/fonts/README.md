# @synapcity/frontend-fonts

Owns: the three default typefaces and how they are loaded. Inter (`next/font/google`), Geist and Geist Mono (`next/font/local`, from the two `.woff` files in `src/next/`), each loaded once, with the arguments the apps always used. It exports the class names that define `--font-inter`, `--font-geist-sans` and `--font-geist-mono`.

It owns no font role, size, weight, line height or fallback stack: the roles and their `--font-preference-*` overrides live in [`frontend-tailwind-config`](../tailwind-config/README.md) ([ADR-0003](../../../docs/architecture/decisions/0003-typography-roles-and-font-preferences.md)), and a component never imports a font. It loads nothing a user chooses: user-selected fonts are fetched at run time by [`frontend-preferences`](../preferences/README.md). Default labels ("Default (Geist)") stay in `domain-preferences`, which `domain` rules keep from importing this package.

## Entry point

| Import                           | Provides                                                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `@synapcity/frontend-fonts/next` | `fontVariableClasses` (the three class names, in order) and `fontVariables` (the same, joined with a space for `className`) |

There is no portable entry: `next/font` is a build-time Next.js feature, so the whole package is a framework adapter and lives under `src/next/` (rule R11 of [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md)). Add a portable entry only when a consumer that is not Next.js needs the variable names.

## How each host uses it

| Host                        | Where                      | How                                                                                                               |
| --------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `apps/web`                  | `src/app/layout.tsx`       | `className={cn(fontVariables, ...)}` on `<html>`                                                                  |
| `apps/web` (`global-error`) | `src/app/global-error.tsx` | the same, because `global-error` replaces the layout and brings its own `<html>`                                  |
| `apps/docs`                 | `src/app/layout.tsx`       | `className={cn(fontVariables, ...)}` on `<html>`                                                                  |
| Storybook                   | `.storybook/preview.tsx`   | `document.documentElement.classList.add(...fontVariableClasses)`: `classList.add` throws on a string with a space |

Each host keeps applying the fonts to its own runtime; this package only provides what is shared.

## Things that look redundant and are not

- **The variable names are literals in `src/next/fonts.ts`**, and appear a second time in `shared-styles.css`. `next/font` reads its arguments at build time, so they cannot come from an imported constant. `frontend-tailwind-config`'s `tokens.test.ts` fails if the two disagree.
- **The `.woff` files sit beside the loader**, because `localFont`'s `src` is resolved relative to the file that calls it. They are not exported: nothing needs a raw URL, and the apps serve them from hashed `_next/static/media/` names.
- **Stylesheet before fonts in each layout.** `frontend-tokens` (a candidate package, loaded through `frontend-ui/styles.css`) declares its own un-ranged `@font-face` for `Inter`. A layout that imports the fonts first puts that face last in the cascade and the browser downloads it too. `src/ownership.test.ts` checks the order.

## What the tests protect

- `src/next/fonts.test.ts`: the exact loader arguments (subset, variable names, Geist Mono `preload: false`), that the files exist, the class-name contract, and the SHA-256 of both `.woff` files.
- `src/ownership.test.ts`: font binaries exist once (the tokens package's self-hosted pair is listed by name), `next/font` is imported in `fonts.ts` only, and web, docs and Storybook each declare and import this package.

## Licence

Geist and Geist Mono (Vercel, in collaboration with basement.studio) and Inter (The Inter Project Authors) are under the SIL Open Font License 1.1. The OFL asks that the copyright notice and licence text accompany the font software, so the upstream texts are kept here unmodified:

- `licenses/Geist-LICENSE.txt`: `LICENSE.txt` from `vercel/geist-font`, covering the two `.woff` files in `src/next/`.
- `licenses/Inter-LICENSE.txt`: `LICENSE.txt` from `rsms/inter`, covering Inter, which `next/font/google` fetches at build time and the apps serve from their own `_next/static/media/`.

Both were copied on 2026-10-29 from the `main` and `master` branches of those repositories. Do not edit them; replace them from upstream. The `.woff` files themselves embed no licence strings (name table ids 0, 13 and 14 are absent) and are unchanged from what the apps shipped before this package existed. The built apps do not serve the licence texts; whether to publish them (for example on a legal page) is a product decision outside this package. `frontend-tokens` carries its own Inter and JetBrains Mono files, which this package does not cover.

## Scripts

`lint`, `check-types`, `test`, `test:coverage`.
