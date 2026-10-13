# Theme store and persistence — design

**Status:** Draft for review. Not authoritative: it records a proposed design and approves nothing under `AGENTS.md` §5.
**Date:** 2026-10-10
**Source:** `docs/theme-tasks.md` ("Theme Mode Tasks" 6–10), sub-project B of five (A mode provider, done; B store and persistence; C primary ramp; D harmony; E accent).
**Governing record:** ADR-0016 (Proposed). Persistence keys, schema, identifiers and the sync rule are listed there as undecided; this design proposes them for approval.
**Builds on:** `docs/superpowers/specs/2026-10-10-theme-mode-provider-consolidation-design.md` (mode, `theme` cookie, pre-paint script).

## Purpose

What the user applies in the theme sheet (colours, fonts, text size, radius, density) survives a reload and is painted on the first frame, with no flash and no state leaking between requests. Today it is lost on reload.

## Evidence (current code)

| Fact | Where |
| --- | --- |
| Colours, typography and display each have a provider in `apps/web`. They hold **draft** state only: each fixes its starting values at mount and a reset returns there. | `apps/web/components/theme/providers/*` |
| The applied theme is a module-level `record` (`applied`, `seed`, `modeBefore`, `modeApplied`). It survives the sheet remounting and is lost on reload. Apply injects one `<style id="synapcity-applied-theme">` built by `appliedCss`. | `apps/web/components/theme/lib/apply.ts` |
| The sheet mirrors that record with `useState(getAppliedRecord)` and writes through `recordApply` / `clearApplied`. | `apps/web/components/theme/components/containers/theme-sheet.tsx` |
| The colour math, font list and control ranges contain no browser API, so the server can run them. | `lib/color-math.ts`, `lib/fonts.ts`, `lib/appearance.ts` |
| `fontValue(id)` does `fonts.find(...)!` and throws for an unknown id. | `lib/fonts.ts` |
| Mode is owned by `ThemeProvider` with cookie `theme` and a pre-paint script. | sub-project A |
| `TextScaleProvider` (`ui-core`) is a separate path: cookie `text-scale`, variable `--text-scale`. The sheet applies `--text-base-size` instead. Not mounted by `apps/web`. | `ui-core/src/providers/text-scale-provider.tsx`, ADR-0016 "Unresolved" |
| No state, cookie or validation library is declared in any `package.json`. | repository search |

## Decisions taken

All were recommendations, accepted by the owner's blanket acceptance of recommendations; none was individually confirmed.

1. **One store for the applied theme; mode stays with `ThemeProvider`.** The applied record becomes a single external store read with `useSyncExternalStore`. The draft providers stay editor-local, as ADR-0016 "Structure" describes. Mode is a document-level concern owned by its provider (ADR-0016) with its own cookie and pre-paint script, so it is not folded in.
2. **No new dependency.** A module-level store plus `useSyncExternalStore` covers it. Adding Zustand or similar would be a §5 dependency decision with no gain here.
3. **The cookie is the source of truth for first paint; `localStorage` is not used yet.** The server can read a cookie, so only a cookie can put the theme in the first HTML. `localStorage` is invisible to the server and would add nothing to first paint. This narrows ADR-0016's "cookie and local storage" direction; the ADR text needs confirming or amending.
4. **Persist the inputs, not the generated tokens.** Colour inputs are a primary colour, a preset id, a harmony and an accent index. Tokens (dozens of variables per mode) are rebuilt from them on the server and the client. The payload stays small, and a saved theme follows later fixes to the colour math instead of freezing old output.
5. **One versioned cookie**, interim name `theme-prefs`, payload version 1. The name is a persisted identifier and is interim until the key scheme is approved.
6. **The server renders the style.** The root layout reads the cookie, validates it, and renders the same `<style>` Apply writes, so the first HTML already carries the theme.
7. **A bad cookie is ignored whole.** Any validation failure falls back to the app's own defaults. No partial application.
8. **Scope is global only**, as ADR-0016's interim behaviour says. Regions, components and named themes are not touched.

## Design

### 1. Persisted payload (version 1)

```ts
type PersistedTheme = {
  v: 1;
  colors?: {
    primary: { l: number; c: number; h: number };
    preset: string; // a known preset id, or 'custom'
    harmony: HarmonyId;
    accentIndex: number | null;
  };
  fonts?: Partial<Record<FontRole, FontId>>;
  radius?: number; // 0–12, integer
  density?: number; // -3–3, integer
  scale?: number; // 80–150, multiple of 5
};
```

Only what the user applied is present, mirroring `changesBetween`: the editor's defaults are not the app's. Mode is not in this payload.

### 2. Validation (`parsePersistedTheme(raw: string | undefined): PersistedTheme | null`)

- Pure, no I/O, no dependency. Decodes the cookie, parses JSON, and checks every field against the same constants the editor uses: `SCALE`, `RADIUS`, `DENSITY`, `fonts`, `HARMONIES`, `PRESETS`, and the colour bounds the sliders allow.
- An unknown version, any field of the wrong type, or any out-of-range value returns `null`.
- Nothing from the cookie reaches CSS as a string. CSS is built only from validated numbers and from ids looked up in the curated lists, via the existing `appliedCss`. The CSS text also has `<` escaped before it is placed in the `<style>` element.

### 3. Store (`apps/web/components/theme/lib/applied-store.ts`)

- Holds `AppliedRecord` as today. `getSnapshot`, `subscribe`, `recordApply`, `clearApplied` replace the free functions.
- Initial client value is read from `document.cookie` through `parsePersistedTheme`. The server snapshot is the empty record. The sheet reads it with `useSyncExternalStore` instead of mirroring it in `useState`.
- **Server invariant (kept from today):** the store is only written from client event handlers. The server never mutates it, so nothing carries between requests. The server only calls the pure `parsePersistedTheme`.
- `recordApply` writes the record, updates the document `<style>`, and writes the cookie (`Path=/`, `Max-Age=31536000`, `SameSite=Lax`, `Secure` on https). `clearApplied` removes the style and expires the cookie.
- `modeBefore` / `modeApplied` stay session-only: they exist to undo a mode change made by Apply. After a reload, revert restores colours, fonts, radius, density and scale, but not mode.

### 4. First paint (root layout)

- The layout reads `theme-prefs`, calls `parsePersistedTheme`, rebuilds the applied theme with the existing `resolveTokens` / `tokenVariables` / `appliedCss`, and renders `<style id="synapcity-applied-theme">` in `<head>` when there is one.
- The client store hydrates from the same cookie, so `applyToDocument` finds the element by id and updates it. Server HTML and first client state agree, so no hydration mismatch.

### 5. Integration

- **Sheet:** starts the editor from the store's `seed`, as it does now; Apply and Revert call the store.
- **Draft providers:** unchanged. Their `initial` still comes from the seed.
- **Mode:** unchanged; still `ThemeProvider` and cookie `theme`. A test pins that Apply's mode change goes through `ThemeProvider`, not the new cookie.
- **Text scale:** unchanged. The `--text-scale` / `--text-base-size` split stays an open item in ADR-0016.

## Verification

- `parsePersistedTheme`: accepts a full payload; accepts each partial; rejects wrong version, non-JSON, out-of-range radius, density and scale, a font id outside the list, an unknown harmony or preset, an accent index out of range, extra nesting, an oversized value; returns `null` for `undefined`.
- CSS safety: a payload containing `</style><script>` in every string field is rejected or produces CSS with no `<`.
- Store: apply → cookie written with the right name and attributes; clear → cookie expired; a second apply merges, as today; subscribers are notified; the server snapshot is empty; a cookie present at load seeds the record.
- Round trip: the CSS the server builds from a cookie equals the CSS the client builds from the same record.
- Layout / smoke (Playwright): with a valid cookie the HTML contains the style before any script; with a corrupt cookie it contains none and the page renders with defaults; with app bundles blocked the theme is still painted.
- Sheet: remount keeps the record; reload keeps it through the cookie; revert clears both.
- Manual: apply a theme, reload, no flash of the default look.
- Repository checks per `AGENTS.md` §6.

## Not in scope

- Named themes, per-user storage, any database, auth.
- Regions, components, scoped overrides.
- `localStorage`, pinned-sheet preference.
- Colour ramp, harmony and accent generation (C, D, E).
- Merging the `--text-scale` and `--text-base-size` paths.
- Finalising the mode toggle components for header, footer and sidebar (tasks 9–10 of the mode list). The mode control in the sidebar is currently commented out; that is a separate follow-up.
- Moving the theme code to a different package (ADR-0016 leaves the location open).
- Renaming anything. Names go through `docs/glossary.md`.

## Approvals this needs

- Cookie name `theme-prefs` (interim) and payload shape version 1: persisted identifiers and schema (§5).
- Cookie-only persistence for now, narrowing ADR-0016's "cookie and local storage" direction. ADR-0016 needs a short amendment either way.
- Server-side rendering of the applied style (an architectural choice about where the theme is resolved).

## Open items for the plan

- Confirm that React does not reconcile or remove a server-rendered `<style>` in `<head>` that the client later edits. If it does, render it through `InlineScript`-style raw markup or a keyed element.
- Read the exact colour bounds from `color-math.ts` and the sliders for the validator, rather than restating them here.
- Check the encoded payload size against a worst case (all three fonts, custom colour) and set a budget well under the 4 KB cookie limit.
- Decide with the owner what the sidebar mode control should be once the hosts are finalised (separate from this sub-project).
