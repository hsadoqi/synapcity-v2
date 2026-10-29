# Shared Default Fonts

**Status:** Implemented 2026-10-29 as option B (section 10), on the repository owner's instruction of that date to implement the migration end to end; pending review in the pull request. Approved in direction by the repository owner on 2026-10-27. Reviewed 2026-10-27 (section 9).  
**Date:** 2026-10-27  
**Requested by:** Repository owner  
**Scope:** Load the three default typefaces once, in a workspace package, and have `apps/web`, `apps/docs` and Storybook consume it. No change to the families, the typography roles or the user override variables.

## 1. Problem

ADR-0003 (amended 2026-10-17) puts the font loaders in `apps/web/src/app/fonts.ts`. That follows the Next.js advice to load each font once in a font definitions file, but the advice is written for one app. The repository now has three hosts that each load Inter, Geist and Geist Mono:

| Host        | Where                    | How                                                                                                                                                                                        |
| ----------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/web`  | `src/app/fonts.ts`       | `next/font/google` for Inter, `next/font/local` for `src/lib/fonts/GeistVF.woff` and `GeistMonoVF.woff`; exports `fontVariables` (built with `cn`) for `layout.tsx` and `global-error.tsx` |
| `apps/docs` | `src/app/layout.tsx`     | its own copy of the same three loaders, reading **its own copy of the two `.woff` files** in `apps/docs/src/lib/fonts/` (byte-identical to web's, checked by MD5 on 2026-10-27)            |
| Storybook   | `.storybook/preview.tsx` | its own copy, reading the `.woff` files from `../../web/src/lib/fonts/`, a path into another app; adds the classes to `<html>` with `classList.add(...array)`                              |

A change to a default family, a weight or a variable name has to be made three times, there are two copies of the font files, and Storybook depends on the web app's file layout.

A fourth source of font files exists on this branch. The candidate package `@synapcity/frontend-tokens` (README status: candidate, not adopted) self-hosts `Inter-Variable.woff2` and `JetBrainsMono-Variable.woff2` through `@font-face` in `src/fonts.css`, and every host loads that file through `@synapcity/frontend-ui/styles.css`. Its `--font-sans` and `--font-mono` are read by nothing today (`tailwind-theme.css` is not imported and `base.css` sets no `font-family`), so browsers should not download those files. That last point is an inference from the CSS; it was not checked in a network panel.

## 2. Goals and non-goals

**Goals:**

- One definition of the default typefaces: one loader call per family, in one file.
- One copy of the `.woff` files (today there are two).
- Every host puts the same font variable classes on `<html>`.
- The CSS variable names (`--font-inter`, `--font-geist-sans`, `--font-geist-mono`) appear in exactly two places, the loader literals and `shared-styles.css`, with a test that they agree. They cannot come from one imported constant: `next/font` needs literal arguments at the call site (section 3).

**Non-goals:**

- Changing the families, weights, `subsets`, `preload` settings, roles or `--font-preference-*` overrides (ADR-0003 items 1 to 3 stand). Geist Mono keeps `preload: false`.
- User-chosen fonts. They load at runtime in `frontend-preferences` and are covered by the font catalogue picker design.
- Moving the typography tokens out of `shared-styles.css`.
- The default labels ("Default (Geist)" and so on). They stay in `domain-preferences` (section 3, boundaries). _Superseded goal, kept for the record: "One source for the default labels shown in settings, which `domain-preferences` currently keeps in step with the web app by comment."_

## 3. Constraints and evidence

- **Version:** `next` 16.4.3 (`apps/web/package.json`). The bundled docs (`next/dist/docs/01-app/03-api-reference/02-components/font.md`, "Using a font definitions file") recommend calling each loader once and importing the result. They say nothing about monorepos.
- **Build time only:** `next/font` runs at build time; calls must be at module scope with literal arguments. So the variable names cannot be imported constants passed to the loaders.
- **Relative paths:** `localFont`'s `src` is resolved relative to the file that calls it, so the `.woff` files must sit beside the definitions.
- **Workspace packages:** a Next.js commit made `next/font` work for code compiled through `transpilePackages` and in auto-configured monorepos. Neither `next.config` here sets `transpilePackages`; other source-pointing workspace packages already compile without it. Whether `localFont` called inside a workspace package works under Turbopack in 16.4.3, in both `next build` and `next dev`, was **NOT VERIFIED** when this was drafted. Verified 2026-10-29: it does, in `next build` and `next dev` for web and docs and in a Storybook build (section 10).
- **Storybook:** `@storybook/nextjs-vite` 10.6.3 handles `next/font` in stories; the same package import must work there. `classList.add` throws on a string that contains a space, so Storybook needs the classes as an array, not the joined `fontVariables` string.
- **Boundaries, R11 (verified by reading `packages/dev/boundaries/src/rules/edge-rules/edge-rules.ts`):** in a frontend package, a production import of `next` must sit under `src/next/`. Legacy packages are not exempt from R11. A `fonts/next/` folder at a package root would be reported.
- **Boundaries, matrix (verified in `matrix.ts` and its test):** `domain` may import only `domain`. `domain-preferences` therefore cannot read labels from a frontend package; a frontend package may read them from `domain-preferences`.
- **Repository convention:** frontend packages declare `next` as a dependency pinned to the apps' version (`frontend-shells` declares `"next": "16.4.3"`).

## 4. Design

- A `fonts` unit with one entry point, `./next`, holding:
  - the three loaders, with the arguments they have today;
  - the two `.woff` files beside them;
  - `fontVariableClasses`, a readonly array of the three `.variable` class names, and `fontVariables`, the same joined with a space. Plain `join(' ')`, not `cn`: there is nothing for `tailwind-merge` to merge.
- No portable entry. Nothing outside the loaders needs the variable names at run time, and the labels stay in `domain-preferences`. _Superseded design, kept for the record: "portable entry: the variable names and the default family labels per role"._ Add one if a framework-free consumer appears.
- `apps/web/src/app/fonts.ts` is removed; `layout.tsx` and `global-error.tsx` import `fontVariables` from the package. The two `global-error` tests mock the package path instead of `./fonts`.
- `apps/docs` drops its loaders and deletes `src/lib/fonts/`.
- Storybook drops its loaders and spreads `fontVariableClasses` into `classList.add`.
- `domain-preferences` keeps `defaultFontLabels`. Its comment points at the fonts unit instead of `layout.tsx`.

## 5. Owning package

Resolved 2026-10-29: option B (section 10). The options and reasoning are kept as written.

| Option                                                                                             | For                                                                                                | Against                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. `@synapcity/frontend-tailwind-config`**, files under `src/next/fonts/`, export `./fonts/next` | Already owns the typography tokens that read these variables                                       | A CSS-only legacy package (exports are `.css` and a PostCSS config) gains `next`, TypeScript runtime code and an `src/` folder. If `frontend-tokens` replaces or merges with it, the fonts move a second time. _The first draft named `fonts/` with `./fonts/next`, which R11 would report._ |
| **B. New `@synapcity/frontend-fonts`**, `src/next/` with export `./next`                           | One purpose; follows R11 and the `frontend-shells` layout; unaffected by how the tokens merge ends | One more workspace; a topology change under ADR-0014 (inventory row, ownership map)                                                                                                                                                                                                          |
| **C. `@synapcity/frontend-tokens`**                                                                | Already self-hosts font files and carries the family stacks of the Claude Design export            | A candidate, not adopted; it would need ADR-0002 and ADR-0003 amended first, and today it is CSS-only too                                                                                                                                                                                    |
| **D. No `next/font`: `@font-face` in a CSS package** (how `frontend-tokens` does it)               | No spike risk; works in every host without framework code                                          | Loses what `next/font` gives today: generated fallback metrics (`size-adjust`) that cut layout shift, preload, and hashed file names; Inter would have to be self-hosted                                                                                                                     |

Recommendation: **B**. _The first draft recommended A._ The reasons for the change: A changes the character of a CSS-only package and would probably move again once the `frontend-tokens` merge is decided; B is small, follows the existing `./next` pattern, and does not depend on that merge. D is the fallback if the Task 1 spike fails.

## 6. ADR change

Amend ADR-0003 item 4 and the 2026-10-17 amendment: the loaders live in the chosen package and every host consumes them. Item 5 ("adding a selectable font means adding a loader") is already out of date, because selectable fonts are fetched from Google Fonts at run time; the font catalogue picker design rewrites it, and this change leaves it alone. Update `AGENTS.md` line 139, which still says fonts load in `apps/web/src/app/layout.tsx`.

## 7. Verification

- Task 1 spike: `next build` and `next dev` for `apps/web`, and a Storybook build, with the loaders imported from a package.
- After the move: a fresh `next build` of `apps/web` and `apps/docs` (`.next/static/media/` holds the hashed Inter, Geist and Geist Mono files; the page CSS defines the three variables) and `pnpm build:storybook` (the same files are in `storybook-static`).
- `pnpm boundaries` with no new exception, and `pnpm deps`.
- A test that the three names in the loader literals are the ones `shared-styles.css` reads.
- Visual check in light and dark mode on web, docs and one story: headings in Geist, body in Inter, code in Geist Mono, no fallback flash on reload, and Geist Mono still not preloaded (no `<link rel=preload>` for it).
- `pnpm verify`.

## 8. Open questions

- **O1. Default code face.** _Resolved 2026-10-29: Geist Mono stays, as ADR-0003 item 2 says; `frontend-tokens` is not adopted, so its JetBrains Mono does not change the default._ `frontend-tokens` (from the Claude Design export) uses JetBrains Mono for code; ADR-0003 item 2 and this design keep Geist Mono. If the merge will change the default, decide that before this move, or the files move twice.
- **O2.** Option A, B, C or D (section 5). _Resolved 2026-10-29: B._

## 9. Review, 2026-10-27

**Verified by reading the files on `feat-tokens-package`:** the loaders in all three hosts; the second, identical copy of the `.woff` files in `apps/docs`; Storybook's `classList.add(...array)`; R11's `src/next/` rule; the `domain` row of the dependency matrix; the `frontend-tokens` font files and README; the `frontend-shells` manifest.

**Inferences, not checked:** that the `frontend-tokens` font files are not downloaded today; that `next/font` works from a workspace package (Task 1 decides).

**Corrections applied:** the docs `.woff` copy was missing from the problem and the plan; option A's paths broke R11; the label direction was left open although the matrix already settles it; "one definition of the variable names" could not be met with imported constants; Storybook would throw on the joined string; option C, option D and O1 were missing; the ADR change also amended item 5, which belongs to the catalogue design; the verification steps were made concrete.

## 10. Result, 2026-10-29

- **Chosen:** option B. The instruction of 2026-10-29 allowed a dedicated package where it gives a clearer, enforceable ownership model; it does (rule R11 keeps `next/font` under `src/next/`, and `pnpm boundaries`, `pnpm deps` and the package's tests enforce the rest). Topology adoption under ADR-0014 is recorded in the workspace conventions inventory and the ownership map; the pull request is the place to object.
- **Spike (plan Task 1):** done in place rather than on a scratch branch, because the real package was the smallest test. Production `next build` of web and docs and `pnpm build:storybook` pass with the loaders in the package; `next dev` for web and docs serves the same three variables and the same hashed files; Storybook emits the same hashed Geist assets as before.
- **Found while verifying:** `frontend-tokens` declares an un-ranged `@font-face` for `Inter` (byte-identical to the latin subset `next/font` serves). Docs imported its fonts before its stylesheet, so that face came last and docs downloaded it as well; web did not. Importing the stylesheet first, as web does, removes that request in docs. `frontend-tokens` is unchanged; its README records the hazard and `src/ownership.test.ts` keeps the import order.
- **Left alone:** families, weights, subsets, `preload`, variable names, roles, overrides, the labels in `domain-preferences`, and `frontend-tokens`' own fonts.
