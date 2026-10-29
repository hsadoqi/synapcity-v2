# Font Catalogue Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Approved (owner, 2026-10-27). Reviewed 2026-10-27 (spec section 8). Not started. Tasks 2 and 3 wait on the owner's answer to spec O1, Task 4 on O2.

**Independent of** the [shared default fonts plan](2026-10-27-shared-default-fonts.md): the default labels stay in `domain-preferences` (spec 3.6). _Superseded: "Runs after the shared default fonts plan; … Task 6 Step 3 [depends on it]"._ Both plans edit ADR-0003 and `AGENTS.md`, so land them one after the other.

**Goal:** Replace the 19 hand-picked fonts with a searchable combobox over the Google Fonts catalogue, filtered per role, with the family name as the persisted value and every old id still accepted.

**Governing:** [Font catalogue picker design](../specs/2026-10-27-font-catalogue-picker-design.md) (decisions D1 to D4, open questions O1 to O4), [ADR-0003](../../architecture/decisions/0003-typography-roles-and-font-preferences.md), [ADR-0010](../../architecture/decisions/0010-preference-persistence.md), [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md).

## Global Constraints

- Old saved looks, cookies, `localStorage` documents, `user_preferences` rows and exported files must keep loading. Tests for that come before any schema change.
- `LOOK_VERSION` and `TRANSFER_FILE_VERSION` do not change (spec 3.2).
- The API key is never committed, logged or shipped.
- The snapshot is imported only through the catalogue entry point: never by `themeSchema`, `lookSchema`, the boot scripts, `lookHtmlAttributes`, `font-loading.ts` or the shells.
- One shape rule and one slug function, each defined once; the boot scripts are generated from them.
- UI rules from `AGENTS.md`: the installed combobox, variants over `className`, no bracket values, story and test per component.
- Process: a task scope entry in `.agents/task-scope.md` before Task 1; commits and pushes only when authorized.

## Tasks

### Task 1: Catalogue snapshot

- [ ] **Step 1: Failing tests** for the generator's pure part (input: a recorded API response fixture, no network): keeps only families with a `regular` variant and the `latin` subset, drops the denylist, marks the first 30 by popularity as `popular`, sorts by family, fails on a family outside the shape rule, a family equal to `default`, a slug collision, or a missing legacy family.
- [ ] **Step 2:** Root script `pnpm fonts:snapshot` reading `GOOGLE_FONTS_API_KEY`; fails with a clear message if it is missing, and never prints the key or the request URL. Writes `packages/domain/preferences/src/schemas/fonts/catalogue.json` with `family`, `category` and `popular` only.
- [ ] **Step 3:** Run it once; commit the JSON. Record its size and family count in the spec (replacing the estimates).
- [ ] **Step 4: Failing tests, then readers** in a catalogue entry point of `domain-preferences` (its own export path): `fontCatalogue`, `isCatalogueFamily`, `familiesForRole` (D3 filters), `fontCategory`. Every legacy id resolves to a catalogue family allowed for each role list it is in today.
- [ ] **Step 5:** A test that the schema modules do not import the catalogue entry point (an import-graph check, like the existing architecture ratchets).

### Task 2: Persisted value (after O1)

- [ ] **Step 1: Failing tests first.**
  - `themeSchema` and `lookSchema`: each legacy id parses to its family; `'default'` parses; a well-formed family parses whether or not it is in the snapshot; a value with a quote, `;`, `(`, `/` or over 64 characters is rejected (and in `lookSchema` the whole look is rejected, as today).
  - The catalogue check: a catalogue family allowed for the role passes; a family outside the role's categories fails; an unlisted family fails.
  - Round trips: a version-1 cookie, a `localStorage` document, a `user_preferences` row and a version-2 export, each holding legacy ids, load with families and save back with families.
  - _Superseded test list, kept for the record: "an unknown family is rejected; … a family missing from the snapshot reads as `'default'`" (contradictory) and "an exported file from the current `LOOK_VERSION` imports" (export files carry `TRANSFER_FILE_VERSION`, not `LOOK_VERSION`)._
- [ ] **Step 2:** Replace `z.enum(headingFonts)` and the other two in `theme.ts` and `look.ts` with the shape schema plus legacy normalisation. Keep exporting the legacy lists for anything that still needs them; types `FontChoice` becomes `'default' | string` with a branded family type if it reads better.
- [ ] **Step 3:** The catalogue check in the settings import path and in the account preferences Server Action (server side, before the write).
- [ ] **Step 4:** `fontLabel(role, value)`: `Default (…)` from `defaultFontLabels`, otherwise the family name.

### Task 3: Head script (after O1)

- [ ] **Step 1: Failing tests** in `look-source.dom.test.ts`, `boot-scripts-cookie.dom.test.ts` and `font-preferences.dom.test.ts`: a family value from the cookie, from `localStorage` and from `data-synapcity-look` applies before paint; a legacy id applies as its family; a malformed value is rejected (cookie: as one unit; `localStorage`: that field only, as today); a stylesheet link is added once per family; each boot script is no longer than its entry in `boot-scripts.expected.json` before the change.
- [ ] **Step 2:** In `lookCookieExpression`, replace the three font lists with the shape rule and the 19 legacy ids; leave the other fields' lists as they are. In `fontBootScript`, replace the 19-entry URL and stack table with the legacy map and the URL and stack built from the family (Task 4's functions, stringified).
- [ ] **Step 3:** Regenerate `boot-scripts.expected.json` and review the diff: only the font parts change.

### Task 4: Loading (after O2)

- [ ] **Step 1:** `fontStylesheetUrl(family)` with `:wght@400;500;600;700`; `fontStack(family, role)` with the role's shipped default as the fallback; `fontLinkId` from the shared slug; `previewFontValue` and `previewFontStyle` follow.
- [ ] **Step 2:** `lookHtmlAttributes` uses the new `fontStack`; its tests updated.
- [ ] **Step 3:** Loading tests updated; add: a family with spaces, a legacy id, an exact URL for one family (pins the format), and that no URL contains `..`.

### Task 5: Picker

- [ ] **Step 1:** In `font-rows.tsx`, swap `SettingsSelect` for the combobox with `ComboboxVirtualList`: `'default'` first; Popular, then A to Z without the Popular families; a query gives one ranked list.
- [ ] **Step 2:** Option content: the family name in the interface font as the accessible name, an `aria-hidden` sample in the family. Sample stylesheets via `text=` preview links with `font-preview-<slug>` ids, after the option has been visible about 150 ms.
- [ ] **Step 3:** A saved family not in the snapshot shows as the selected value with "no longer in the list".
- [ ] **Step 4:** Story and test updates (the list, a query, the unlisted state, keyboard selection); keyboard and screen reader checks by hand.

### Task 6: End-to-end and docs

- [ ] **Step 1:** `apps/web/e2e/shared-look.e2e.ts`: choose a family per role and reload; load a look saved with an old id. Route `fonts.googleapis.com` and `fonts.gstatic.com` to a stub so the tests do not depend on Google, and assert the requested URL.
- [ ] **Step 2:** Amend ADR-0003 (spec section 5), including item 5, and the selectable-font half of `AGENTS.md` line 139. Fix the stale "Moves to frontend-preferences in M6.2" note in `font-loading.ts`.
- _Superseded: "Step 3: Default labels from the shared default fonts package (after that plan lands)". Not possible in the allowed dependency direction (spec 3.6)._

### Task 7: Verify

- [ ] `pnpm verify`, plus a production build check that `catalogue.json` appears only in the settings route's chunks and the server output, and in no root layout or shell chunk.
- [ ] Manual: pick a font per role, reload without a flash, block `fonts.googleapis.com` and see each role's shipped font, import an old exported look, keyboard-only and screen reader use of the picker, light and dark mode, the docs host showing the same fonts from the shared cookie.
- [ ] Report what ran, passed, failed and was not run.
