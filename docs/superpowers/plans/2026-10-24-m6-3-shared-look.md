# Milestone 6.3 shared look Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A person's look (mode, density, text size, display settings, fonts, corner radius) set in the web app shows the same in the docs app, with no flash, carried in one cookie on the parent domain.

**Architecture:** `domain-preferences` defines the versioned `look` contract and the rule for which values may enter it. `frontend-preferences` reads and writes it behind the device store, and the three boot scripts plus a new mode boot script read the cookie first and fall back to `localStorage`. Web writes it wherever a look field changes; docs reads it and writes mode only. `localStorage` keeps the rest of the preference document.

**Tech Stack:** TypeScript 7.0.2, React 19.3.0, zod (the version `domain-preferences` declares), `next-themes` ^0.4.6, Vitest 4.1.12 with jsdom, Playwright (existing config), pnpm workspace.

**Spec:** [2026-10-24-m6-preferences-settings-design.md](../specs/2026-10-24-m6-preferences-settings-design.md), sections 4.2, 4.3, 4.7, 4.8 and 8 (M6.3), and the Q1 and Q4 answers in section 9. Builds on [M6.2](2026-10-24-m6-2-frontend-preferences.md). Governing: [ADR-0010](../../architecture/decisions/0010-preference-persistence.md) (amended by Task 8), [ADR-0003](../../architecture/decisions/0003-typography-roles-and-font-preferences.md).

## Global Constraints

- **What the cookie holds** (spec 4.3), and nothing else: `theme.mode`, `theme.density`, `theme.textSize`, `theme.radius`, the three font choices (`theme.headingFont`, `theme.bodyFont`, `theme.codeFont`), and the display fields `appearance.animationsEnabled`, `appearance.reducedMotion`, `appearance.contrastMode`, `appearance.showBorders`. No regional, notification or privacy values, no ids, no tokens.
- **Cookie:** name `synapcity-look`; value is URL-encoded JSON `{ "v": 1, "theme": {...}, "appearance": {...} }`; `Path=/`, `SameSite=Lax`, `Secure` on https, `Max-Age=31536000`; not `HttpOnly`. `Domain` is set only when the host gives one (`NEXT_PUBLIC_PREFERENCES_COOKIE_DOMAIN`); unset means host-only.
- **Reading:** a cookie that fails the domain `look` schema, or carries any `v` other than `1`, is ignored as if absent. It is never trusted and never throws.
- **Precedence is unchanged** (ADR-0010): account override, then device value (now the cookie), then default. Scopes stay as `settingScope` has them.
- **Behavior otherwise unchanged:** stored keys, the saved event, data attributes, and the account cache in `localStorage` (C4).
- **Mode:** the cookie is authoritative for mode. `next-themes`' own entry (`theme`) is seeded from it before hydration (this resolves the M6.2 open item).
- **Docs** writes mode only (Q4), through its existing toggle; it shows no Settings screen and reaches no server or web-app code. **Storybook** neither reads nor writes the cookie (C2): it shares `localhost` with web and docs, so writing is opt-in on `ModeProvider` (`shareLook`, default off) and only web and docs turn it on.
- **No server rendering of the look** (C3). No new dependency. No `next` import in `frontend-preferences`.
- **Commits** only when the owner authorizes them. Conventional style; end with the attribution line the session's reminder gives; no GitHub closing keyword near an issue reference. Never quote the owner in any document or commit; record decisions as "owner decision, date".

## Review Focus

1. **Tampered, truncated or other-version cookie.** `v: 2`, non-JSON, `theme` as a string, an unknown font id, a `textSize` of 9999: the page ignores the cookie, uses `localStorage` then defaults, writes no arbitrary attribute, and throws nothing (Tasks 1 and 3).
2. **No cookie at all** (a signed-out person on docs, or a first visit): defaults, no console error, no attribute left half-set (Task 3).
3. **Cookies blocked or domain mismatched.** A write the browser rejects does nothing visible and does not turn the Settings status into "Browser storage is unavailable" (that status stays tied to `localStorage`) (Task 2).
4. **Mode changed on docs, then web opened.** Web shows the new mode, and the Settings provider does not overwrite it from a stale `theme.mode` in its saved document (Tasks 4 and 5).
5. **Private values never leave.** Settings holding regional, notification and privacy values produce a cookie with only the allowed keys (Task 1), and the serialized cookie stays well under the 4 KB browser limit (Task 2).

---

### Task 1: The `look` contract in `domain-preferences`

**Files:**

- Create: `packages/domain/preferences/src/schemas/look/{look.ts,look.test.ts,index.ts}`; export from the package's schemas index and root entry the way sibling units are.

**Interfaces:**

- Produces (`@synapcity/domain-preferences`):
  - `LOOK_VERSION = 1`, `LOOK_COOKIE_NAME = 'synapcity-look'`.
  - `lookSchema` (zod): `{ v: z.literal(1), theme: themeSchema.pick({mode, headingFont, bodyFont, codeFont, radius, density, textSize}), appearance: displaySchema }`; `type Look = z.infer<typeof lookSchema>`.
  - `lookOf(settings: Settings): Look`: builds the look from full settings, keeping only the allowed fields.
  - `parseLook(raw: unknown): Look | null`: `null` for anything invalid or not `v: 1`.

- [ ] **Step 1: Write the failing tests** in `look.test.ts`:
  - `it('keeps only the look fields from full settings')`: settings with non-default regional, notification and privacy values; `Object.keys(lookOf(s))` equals `['v','theme','appearance']`, `theme` has exactly the seven theme keys, `appearance` exactly the four display keys, and `JSON.stringify(lookOf(s))` contains none of the regional, notification or privacy values.
  - `it('round-trips through parseLook')`.
  - `it('ignores anything invalid or newer')`: `parseLook` returns `null` for `{v:2,...}`, `{v:1,theme:'x'}`, an unknown font id, `textSize: 9999`, `null`, a string, `[]`.
- [ ] **Step 2: Run them.** `pnpm --filter @synapcity/domain-preferences test`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `lookSchema`, `lookOf`, `parseLook` (a `safeParse` wrapper) and the two constants.
- [ ] **Step 4: Run the checks:** package `test`, `lint`, `check-types`; `pnpm boundaries`; `pnpm deps`. Expected: pass.
- [ ] **Step 5: Checkpoint commit** (if authorized): `feat(domain-preferences): add the shared look contract`.

### Task 2: Look cookie in the device store

**Files:**

- Create: `packages/frontend/preferences/src/store/look-cookie/{look-cookie.ts,look-cookie.test.ts,index.ts}`; export from `src/store/index.ts`.

**Interfaces:**

- Consumes: `Look`, `parseLook`, `LOOK_COOKIE_NAME` from Task 1.
- Produces (`@synapcity/frontend-preferences`):
  - `configureLookCookie(config: { domain?: string }): void`: module-level setting the host calls once at startup. Empty string counts as unset.
  - `serializeLookCookie(look: Look, options: { domain?: string; secure: boolean }): string`: the full `name=value; Path=/; SameSite=Lax; Max-Age=31536000[; Domain=...][; Secure]` string.
  - `readLookCookie(): Look | null`: from `document.cookie`, through `parseLook`; never throws.
  - `writeLookCookie(look: Look): void`: sets `document.cookie` using the configured domain and `Secure` when `location.protocol === 'https:'`; never throws.

- [ ] **Step 1: Write the failing tests** (jsdom):
  - `it('serializes with the agreed attributes')`: asserts `Path=/`, `SameSite=Lax`, `Max-Age=31536000`, no `HttpOnly`; `Domain=.example.com` only when given; `Secure` only when asked.
  - `it('writes and reads back the same look')`.
  - `it('reads a missing, malformed or newer cookie as null')`, including a value that is not valid URL encoding.
  - `it('writes host-only when no domain is configured')`: the cookie is readable in jsdom (a `Domain` for a foreign host would be rejected, so this also proves the unset path).
  - `it('does not throw when the browser refuses the write')`: stub the `document.cookie` setter to throw.
  - `it('stays well under the cookie size limit')`: serialized length of a look with the longest allowed values is under 1000 characters.
- [ ] **Step 2: Run them.** Expected: FAIL (module not found).
- [ ] **Step 3: Implement** the four functions. `readLookCookie` splits `document.cookie` on `; ` and decodes with `decodeURIComponent` inside a `try`.
- [ ] **Step 4: Run the checks** as in Task 1 for this package. Expected: pass.
- [ ] **Step 5: Checkpoint commit** (if authorized): `feat(frontend-preferences): read and write the shared look cookie`.

### Task 3: Boot scripts read the cookie first

**Files:**

- Create: `packages/frontend/preferences/src/scripts/look-source/{look-source.ts,index.ts}`: the shared script prologue as an exported string `lookSourceScript` (defines the function the three scripts call to get the saved object).
- Modify: `scripts/appearance-attributes/appearance-attributes.ts`, `scripts/theme-shape/theme-shape.ts`, `scripts/font-preferences/font-preferences.ts` (each boot script obtains its source object from the cookie when valid, else from `localStorage` as today); regenerate `scripts/boot-scripts.expected.json` deliberately; export `lookSourceScript` from `scripts/index.ts` only if a test needs it.
- Test: `scripts/boot-scripts.test.ts` (fixture assertion stays, regenerated) and new `scripts/boot-scripts-cookie.dom.test.ts`.

**Interfaces:**

- Consumes: `LOOK_COOKIE_NAME`, `LOOK_VERSION` from Task 1.
- Produces: unchanged exported names (`appearanceBootScript`, `themeShapeBootScript`, `fontBootScript`); behavior: for each, the source object is `{ theme, appearance }` from a cookie whose JSON has `v === 1` and object `theme` and `appearance`, else the `localStorage` document. Each script still accepts only schema-allowed values (the cookie is not trusted beyond that).

- [ ] **Step 1: Write the failing tests** in `boot-scripts-cookie.dom.test.ts`, running each script string with `new Function(script)()` against a fresh `document.documentElement`:
  - `it('applies the look from the cookie')`: cookie has `density: 'compact'`, `textSize: 120`, `radius: 'soft'`, `contrastMode: 'high'`; the matching data attributes and `--text-scale` are set.
  - `it('prefers the cookie over localStorage')`: both set, different values; the cookie's win.
  - `it('falls back to localStorage with no cookie')`.
  - `it('ignores a newer or tampered cookie and falls back')`: `v: 2`, non-JSON, unknown `radius`, `textSize: 9999`; attributes come from `localStorage` or defaults, nothing throws, no attribute holds the tampered value.
  - `it('uses defaults with neither')`.
  - `it('loads only catalog fonts from the cookie')`: a cookie font id outside the catalog adds no `<link>` and sets no font variable.
- [ ] **Step 2: Run them.** Expected: FAIL (cookie ignored).
- [ ] **Step 3: Implement** `lookSourceScript` and wire the three scripts to it, keeping their validation untouched. Then regenerate `boot-scripts.expected.json` from the new strings and note in the commit that the change is deliberate.
- [ ] **Step 4: Run the checks:** package `test`, `lint`, `check-types`; `pnpm --filter web test` (boot-related web tests); `pnpm boundaries`; `pnpm deps`. Expected: pass; the characterization test passes against the regenerated fixture.
- [ ] **Step 5: Checkpoint commit** (if authorized): `feat(frontend-preferences): boot scripts read the shared look cookie first`.

### Task 4: Mode follows the cookie

**Files:**

- Create: `packages/frontend/preferences/src/scripts/mode-boot/{mode-boot.ts,mode-boot.dom.test.ts,index.ts}`; export from `scripts/index.ts`.
- Modify: `src/providers/mode-provider/mode-provider.tsx` (`useMode().setMode` also writes the mode into the cookie) and its test.

**Interfaces:**

- Produces:
  - `modeBootScript: string`: runs before `next-themes`' own script. If the cookie has a valid mode, it sets `localStorage.theme` to it (the key `next-themes` reads), applies the class and `color-scheme` on `<html>` for `light`/`dark`, and for `system` resolves from `prefers-color-scheme`. With no valid cookie it does nothing.
  - `ModeProvider` gains an optional `shareLook?: boolean` prop (default `false`), passed to `useMode` through context.
  - `useMode().setMode(next)`: unchanged signature; when the enclosing provider has `shareLook`, it additionally writes `writeLookCookie` with the current look (from `readLookCookie()`, else built from the stored document through `lookOf`, else defaults) and `theme.mode = next`. A failed cookie write changes nothing else.

- [ ] **Step 1: Write the failing tests:**
  - `mode-boot.dom.test.ts`: `it('seeds next-themes and the root from a cookie mode')` (`dark` and `light`); `it('resolves system from the operating system')` with `matchMedia` stubbed; `it('does nothing without a valid cookie')`.
  - `mode-provider.test.tsx`: `it('writes the chosen mode into the shared look cookie')` and `it('keeps the other look fields when it writes')`; `it('writes nothing without shareLook')`.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement** the script string and the `setMode` change.
- [ ] **Step 4: Run the checks** for the package, then `pnpm test:storybook` (mode stories and the `ModeToggle` stories still pass). Expected: pass.
- [ ] **Step 5: Checkpoint commit** (if authorized): `feat(frontend-preferences): mode follows the shared look cookie`.

### Task 5: Web writes the look

**Files:**

- Modify: `apps/web/src/components/providers/root-providers.tsx` passes `shareLook` to `ModeProvider` (and docs does the same in Task 6); `apps/web/src/features/settings/providers/settings-provider/settings-provider.tsx`, `apps/web/src/features/settings/components/account-preferences-sync/account-preferences-sync.tsx`, `apps/web/src/app/layout.tsx`, `packages/frontend/preferences/src/store/device-store/device-store.ts` and its test.
- Tests: the existing settings-provider and account-sync DOM tests (assertions kept) plus new cases below.

**Interfaces:**

- Produces (`@synapcity/frontend-preferences`):
  - `writeStoredPreferences(value: string)` is unchanged and still throws where `localStorage` throws.
  - `saveLook(settings: Settings): void`: `writeLookCookie(lookOf(settings))`; never throws. Called by the provider and account sync right after they call `writeStoredPreferences`, so every place that changes a look field writes the cookie (spec 4.3 Writers).
  - `migrateLookToCookie(): void`: if there is no valid cookie and the stored document parses, writes the cookie from it once (spec 4.3 Migration); a no-op otherwise.
- Web calls `configureLookCookie({ domain: process.env.NEXT_PUBLIC_PREFERENCES_COOKIE_DOMAIN })` once, at module scope in `root-providers.tsx`, and inlines `modeBootScript` first in `<head>`, before the other three.

- [ ] **Step 1: Write the failing tests:**
  - `device-store.test.ts`: `it('saveLook writes only the look')`; `it('migrates the stored document once and only when there is no cookie')`; `it('leaves an existing cookie alone')`; `it('does nothing when the stored document is unreadable')`.
  - Settings provider test: `it('writes the cookie when a look field is saved')`; `it('does not report storage unavailable when only the cookie write fails')`.
  - Account sync test: `it('writes the cookie after reconciling an account preference')`.
  - Provider/mode test: `it('keeps a mode chosen elsewhere')`: the cookie says `dark`, the saved document says `light`; after mount the provider leaves the root `dark` and does not rewrite the cookie to `light`.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement** `saveLook` and `migrateLookToCookie`; call `saveLook` at the provider's save and apply points and in `AccountPreferencesSync`; call `migrateLookToCookie()` first in `AccountPreferencesSync`'s effect; add the host config and the script to the layout.
- [ ] **Step 4: Run the checks:** `pnpm --filter web check-types`, `lint`, `test`; package `test`, `lint`, `check-types`; `pnpm boundaries`; `pnpm deps`. Expected: pass.
- [ ] **Step 5: Checkpoint commit** (if authorized): `feat(web): write the shared look cookie wherever the look changes`.

### Task 6: Docs shows the look and writes mode

**Files:**

- Modify: `apps/docs/src/app/layout.tsx` (inline `modeBootScript` first, then the three scripts, same comments style), `apps/docs/src/app/providers.tsx` (`configureLookCookie` at module scope, same setting, and `shareLook` on its `ModeProvider`), `turbo.json` (add `NEXT_PUBLIC_PREFERENCES_COOKIE_DOMAIN` to the `build` task's `env`, so the cached build never serves a different domain), the repository's env documentation (`README.md` environment section or `.env.example` if one exists; otherwise the `apps/docs` and `apps/web` READMEs).

- [ ] **Step 1: Write the check.** `pnpm --filter docs build`, then search `apps/docs/.next/server/app/index.html` for the four scripts in order (mode first). Expected before the change: mode script absent.
- [ ] **Step 2: Implement** the layout, provider and config changes.
- [ ] **Step 3: Run the check again.** Expected: four scripts present, in order, each matching `boot-scripts.expected.json` / the mode script string. Then `pnpm --filter docs check-types` and `lint`. Expected: pass.
- [ ] **Step 4: Checkpoint commit** (if authorized): `feat(docs): show the shared look and write mode`.

### Task 7: End to end across both servers

**Files:**

- Modify: `packages/dev/playwright-config/src/index.ts` (add optional `extraServers?: { port: number; command: string }[]` to `CreatePlaywrightConfigInput`, mapped to a `webServer` array with the same `reuseExistingServer` and timeout rules), its README; `apps/web/playwright.config.ts` (add docs on port `4000`: `pnpm --dir ../docs exec next start --port 4000`).
- Create: `apps/web/e2e/shared-look.e2e.ts`.

**Interfaces:**

- Consumes: the cookie name and shape from Task 1; web and docs from Tasks 5 and 6.

- [ ] **Step 1: Write the failing test** `shared-look.e2e.ts`:
  - `test('a look set in web shows in docs with no flash')`: in web, choose the dark mode and a non-default text size through the same UI path `text-size.e2e.ts` uses; then in the same browser context open `http://localhost:4000/` with an init script that records `document.documentElement` class and `data-text-size` at `DOMContentLoaded`; assert dark and the chosen size at that moment (before hydration), and again after load.
  - `test('docs mode toggle shows in web')`: change mode in docs, open web, assert the same mode at `DOMContentLoaded`.
  - `test('docs shows defaults with no cookie')`: fresh context, no console errors, default attributes.
  - `test('a tampered cookie is ignored')`: `addCookies` with `v: 2`; docs loads with defaults.
- [ ] **Step 2: Run it.** `pnpm --filter web test:e2e shared-look` after `pnpm build`. Expected: FAIL before the config change (docs not served), then fail on the look until Tasks 5 and 6 are in place; with them, the first run is the real check.
- [ ] **Step 3: Implement** the config change.
- [ ] **Step 4: Run the whole e2e suite** (`pnpm test:e2e`). Expected: every test passes, including the existing ones, with two servers starting.
- [ ] **Step 5: Checkpoint commit** (if authorized): `test(web): shared look end to end across web and docs`.

### Task 8: Records, probes, gate

**Files:**

- Modify: `docs/architecture/decisions/0010-preference-persistence.md` (an Amendment section: the cookie, its contents, attributes, the not-`HttpOnly` reason, the domain setting, mode authority, migration; the original text stays as history); `docs/architecture/reorganization-ownership-map.md`, `docs/architecture/workspace-conventions.md` (inventory sentence), `docs/architecture/decisions/0014-multi-app-package-boundaries.md` section 7 sentence, `packages/frontend/preferences/README.md` and `packages/domain/preferences/README.md` (the look unit, the store functions, the scripts), `.agents/task-scope.md` (M6.3 entry), the M6 design status line.

- [ ] **Step 1: Update the records.** No owner quotes. Record the calls below under the amendment.
- [ ] **Step 2: Boundary probes** (planted, then removed, with `git status` empty afterwards): an `import 'next/link'` in `frontend-preferences` (expected R0) and an import of `@synapcity/frontend-preferences` from `domain-preferences` (expected a dependency-matrix violation). Record the actual rules reported.
- [ ] **Step 3: Repository gate.** `pnpm verify` with nothing else running. Expected: every stage passes.
- [ ] **Step 4: Report** per AGENTS.md section 9. Manual checks for the owner: set text size and mode in web Settings, open docs (`localhost:4000`) and see them with no flash; change mode in docs and reload web; clear cookies and confirm both sites show defaults; confirm in browser tools that the cookie holds only the look. Next: the M6.4 plan.
- [ ] **Step 5: Checkpoint commit** (if authorized): `docs: record milestone 6.3 shared look`.

## Calls made (owner to check)

- **The cookie is authoritative for the look it carries.** The boot scripts and the mode script read it before `localStorage`; the saved document stays the source for everything else and for the account cache.
- **Account fields (fonts, radius) are cached in the cookie, not owned by it.** The account value still wins when it arrives (reconcile), and the cookie is rewritten from the result.
- **The cookie domain is a module-level host setting** (`configureLookCookie`), not a prop or an environment read inside the package, so the package stays framework-neutral and the three writers share it.
- **Invalid or newer means absent**, not repaired: a bad cookie never becomes a partial look.
- **A shared prologue string** serves the three boot scripts so the cookie-first rule lives in one place; the scripts' validation is unchanged.
- **Docs `reuseExistingServer`** follows the existing rule: locally a running docs server on port 4000 is reused; in CI both start fresh.

## Left open on purpose

- Server rendering of the look from the cookie (C3).
- The Settings provider, tabs and screen contracts (M6.4), and error reports (M6.5).
- Whether a person should be able to clear the shared look from Settings (a reset control); out of M6 scope.

## Deviations recorded during execution

- **Task 1:** the `look` unit lives in `packages/domain/preferences/src/utils/look/`, not `schemas/look/`, because `displaySchema` is defined in `utils/scope` and schemas never import utils.
- **Tasks 4 and 5:** `saveLook`, `migrateLookToCookie`, `currentLook` and `shareMode` live in a `store/shared-look/` unit of their own, not in `device-store`, so the device store stays the only owner of the raw keys.
- **Task 3:** the three boot scripts check the cookie's shape and validate values field by field, rather than running the full `look` schema; see the frontend-preferences README.
- **Task 4:** `ModeProvider` gained `shareLook` (default off), so Storybook cannot write the cookie.
- **Task 7:** `theme-shape.e2e.ts` clears cookies between simulated visits, and `web#test:e2e` also depends on `docs#build` in `turbo.json`, because the new test serves the docs production build.
- **Task 2 addition (review):** `configureLookCookie` accepts only a plain host name.
