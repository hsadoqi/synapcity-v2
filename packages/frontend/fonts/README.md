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

Geist and Geist Mono (Vercel, in collaboration with basement.studio; `LICENSE.txt` and `OFL.txt` in `vercel/geist-font`) and Inter (The Inter Project Authors; `LICENSE.txt` in `rsms/inter`) are under the SIL Open Font License 1.1. Checked against those repositories on 2026-10-29. The `.woff` files are the ones the apps shipped before this package existed and are unchanged: they embed no licence or copyright strings (name table ids 0, 13 and 14 are absent), and the repository holds no copy of the licence text for Geist. That gap predates this package; whether to add the notices is the owner's call.

## Scripts

`lint`, `check-types`, `test`, `test:coverage`.
