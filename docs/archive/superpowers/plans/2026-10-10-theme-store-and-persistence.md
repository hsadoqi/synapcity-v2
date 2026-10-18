# Theme store and persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** What a user applies in the theme sheet survives a reload and is painted in the first HTML, with no flash and no state shared between requests.

**Architecture:** The applied record moves out of `apply.ts` into a small external store (`applied-store.ts`) read with `useSyncExternalStore`. A pure module (`persisted-theme.ts`) validates, serializes and rebuilds a versioned `theme-prefs` cookie. The client store reads and writes that cookie; the root layout reads it on the server and renders the same `<style id="synapcity-applied-theme">` the client edits.

**Tech Stack:** React 19.3, Next.js 16.3 App Router, Vitest 5 + Testing Library (jsdom), Playwright. No new dependency.

**Spec:** `docs/superpowers/specs/2026-10-10-theme-store-and-persistence-design.md`

## Global Constraints

- Cookie name `theme-prefs` (interim), payload version `1`, cookie-only persistence (no `localStorage`).
- No new dependency; no state, cookie or validation library.
- Mode is not in this payload: it stays with `ThemeProvider` and cookie `theme`.
- A cookie that fails any check is ignored whole; nothing from it reaches CSS as a string.
- The server never writes the store; it only calls the pure `persistedCss`.
- Cookie attributes: `Path=/; Max-Age=31536000; SameSite=Lax`, plus `; Secure` on https.
- Do not rename anything (names go through `docs/glossary.md`); do not move theme code to another package.
- Commits: one subject line `type: short summary`, types `chore|feat|fix|docs|refactor|test`; no body, no trailers; no GitHub closing keyword near an issue reference.
- Commit explicit paths only, with a bash array (zsh does not word-split a plain variable): `F=(a b); git add -- "${F[@]}" && git commit -m "…" -- "${F[@]}"`.
- Tests: the web Vitest project only includes `hooks/**/*.test.{ts,tsx}` and `components/**/*.test.tsx`; the `ui-core` project only `src/**/*.test.tsx`. Never use the `Function` constructor in tests (use `node:vm`).
- `pnpm docs:check` rejects a backticked `docs/…md` path that does not exist yet; write a not-yet-existing path as plain text.
- Playwright needs the sandbox disabled to start `next dev`.
- Run commands from the repository root: `/Users/hanaasadoqi/Projects/active/synapcity/active/ai-synapcity.worktrees/feat-theming-system`.
- Failing stages that existed before this plan (report, do not fix): `test:storybook` (3 text-scale stories), `test:smoke` (4 tests: `app-shell.spec.ts:542`, `smoke.spec.ts:13`, `:50`, `:94`), `deps`, `deps:boundaries` (13 `no-circular` + 1 `not-to-unresolved`).

## File Structure

| File | Responsibility |
| --- | --- |
| `apps/web/components/theme/lib/persisted-theme.ts` (create) | Pure: payload type, `parsePersistedTheme`, serialize, snapshot ⇄ payload, `persistedCss`, cookie strings. Imports `apply.ts`, never the store. |
| `apps/web/components/theme/lib/applied-store.ts` (create) | The applied record, `subscribeApplied`, snapshots, `recordApply`, `clearApplied`, `hydrateApplied`, cookie read/write. Imports `apply.ts` and `persisted-theme.ts`. |
| `apps/web/components/theme/lib/apply.ts` (modify) | Keeps the pure functions; the record block is removed. |
| `apps/web/components/theme/components/containers/theme-sheet.tsx` (modify) | Reads the store with `useSyncExternalStore`; copy no longer says "until reload". |
| `apps/web/app/layout.tsx` (modify) | Reads `theme-prefs`, renders the style element. |
| `apps/web/tests/theme-prefs.spec.ts` (create) | Playwright: first HTML, corrupt and hostile cookies, paint without app JS, hydration. |
| `docs/architecture/decisions/0016-theme-shape-and-functionality.md` (modify) | Record the persistence decision. |

## Review Focus

1. A corrupt or hostile cookie (not JSON, wrong version, out-of-range value, unknown font, `</style><script>` in a string) must give the app's defaults, never a crash or injected markup. Tasks 1 and 4.
2. The server sees the cookie URL-decoded while `document.cookie` gives it encoded; both must parse. Task 1.
3. An Apply that changes only mode must not write `theme-prefs`, and must not drop a saved theme. Task 3.
4. After a reload the record is rebuilt from the cookie with no `modeBefore`; Revert must clear styles and the cookie and leave mode alone. Task 3.
5. The server snapshot is always empty, even when the client record is not, and the client snapshot is the same object until something changes. Task 2.
6. The worst-case payload (custom colour, longest harmony, three fonts) stays far below the 4 KB cookie limit. Task 1.

---

### Task 1: Persisted payload, validation, rebuild (pure)

**Files:**

- Create: `apps/web/components/theme/lib/persisted-theme.ts`
- Test: `apps/web/components/theme/lib/persisted-theme.test.tsx`

**Interfaces:**

- Consumes: from `./apply`: `appliedCss`, `AppliedTheme`, `ThemeInitial`; from `./color-math`: `accentSourceFor`, `COLOR_RANGES`, `HARMONIES`, `PRESETS`, `resolveTokens`, `tokenVariables`, `HarmonyId`, `Oklch`; from `./appearance`: `DENSITY`, `RADIUS`, `SCALE`; from `./fonts`: `DEFAULT_FONTS`, `fonts`, `FontId`, `FontRole`.
- Produces:
  - `THEME_PREFS_COOKIE = 'theme-prefs'`
  - `type PersistedTheme`, `type AppliedSnapshot = { applied: AppliedTheme; seed: ThemeInitial }`
  - `parsePersistedTheme(raw: string | undefined): PersistedTheme | null`
  - `serializePersistedTheme(theme: PersistedTheme): string`
  - `persistedFromSnapshot(snapshot: AppliedSnapshot): PersistedTheme | null`
  - `appliedFromPersisted(theme: PersistedTheme): AppliedSnapshot`
  - `persistedCss(raw: string | undefined): string`
  - `prefsCookieString(theme: PersistedTheme, secure: boolean): string`
  - `expiredPrefsCookie(): string`

- [ ] **Step 1: Write the failing test**

Create `apps/web/components/theme/lib/persisted-theme.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import {
  THEME_PREFS_COOKIE,
  appliedFromPersisted,
  expiredPrefsCookie,
  parsePersistedTheme,
  persistedCss,
  persistedFromSnapshot,
  prefsCookieString,
  serializePersistedTheme,
  type PersistedTheme,
} from './persisted-theme';
import {
  appliedCss,
  changesBetween,
  seedAfter,
  type ThemeDraft,
} from './apply';
import {
  DEFAULT_TOKENS,
  PRESETS,
  accentSourceFor,
  resolveTokens,
} from './color-math';
import { DEFAULT_FONTS } from './fonts';

const blue = PRESETS.find((p) => p.id === 'blue')!;
const violet = PRESETS.find((p) => p.id === 'violet')!;

const base: ThemeDraft = {
  mode: 'light',
  primary: blue.color,
  preset: blue.id,
  harmony: 'analogous',
  accentIndex: 1,
  scale: 100,
  fonts: DEFAULT_FONTS,
  radius: 4,
  density: 0,
  tokens: DEFAULT_TOKENS,
};

const full: PersistedTheme = {
  v: 1,
  colors: {
    primary: { l: 0.54, c: 0.22, h: 293 },
    preset: 'violet',
    harmony: 'triadic',
    accentIndex: 2,
  },
  fonts: { heading: 'lora', body: 'geist', code: 'geist-mono' },
  radius: 8,
  density: -2,
  scale: 115,
};

const withPatch = (patch: Record<string, unknown>) =>
  JSON.stringify({ v: 1, ...patch });
const withColors = (patch: Record<string, unknown>) =>
  withPatch({ colors: { ...full.colors, ...patch } });

describe('parsePersistedTheme', () => {
  it('reads a full payload in the form document.cookie gives (encoded)', () => {
    expect(parsePersistedTheme(serializePersistedTheme(full))).toEqual(full);
  });

  it('reads the already-decoded form the server gives', () => {
    expect(parsePersistedTheme(JSON.stringify(full))).toEqual(full);
  });

  it.each([
    [{ v: 1, radius: 7 }],
    [{ v: 1, scale: 130 }],
    [{ v: 1, density: 3 }],
    [{ v: 1, fonts: { body: 'lora' } }],
    [{ v: 1, colors: full.colors }],
  ])('reads the partial payload %j', (partial) => {
    expect(parsePersistedTheme(JSON.stringify(partial))).toEqual(partial);
  });

  it('round-trips every preset', () => {
    for (const preset of PRESETS) {
      const theme: PersistedTheme = {
        v: 1,
        colors: {
          primary: preset.color,
          preset: preset.id,
          harmony: 'analogous',
          accentIndex: 1,
        },
      };
      expect(parsePersistedTheme(serializePersistedTheme(theme))).toEqual(
        theme,
      );
    }
  });

  it('accepts a null accent index and the custom preset', () => {
    const theme: PersistedTheme = {
      v: 1,
      colors: {
        primary: { l: 0.5, c: 0.1, h: 10 },
        preset: 'custom',
        harmony: 'none',
        accentIndex: null,
      },
    };
    expect(parsePersistedTheme(JSON.stringify(theme))).toEqual(theme);
  });

  const rejected: [string, string | undefined][] = [
    ['undefined', undefined],
    ['an empty string', ''],
    ['text that is not JSON', 'not json'],
    ['a truncated encoded value', '%7Bbroken'],
    ['a malformed percent escape', '%E0%A4%A'],
    ['an array', '[1]'],
    ['a different version', JSON.stringify({ v: 2, radius: 7 })],
    ['no version', JSON.stringify({ radius: 7 })],
    ['a version with nothing in it', JSON.stringify({ v: 1 })],
    ['an unknown top-level key', withPatch({ radius: 7, extra: 1 })],
    ['a radius above the range', withPatch({ radius: 13 })],
    ['a negative radius', withPatch({ radius: -1 })],
    ['a fractional radius', withPatch({ radius: 4.5 })],
    ['a radius given as text', withPatch({ radius: '7' })],
    ['a scale that is not a step of 5', withPatch({ scale: 82 })],
    ['a scale above the range', withPatch({ scale: 155 })],
    ['a scale below the range', withPatch({ scale: 75 })],
    ['a density above the range', withPatch({ density: 4 })],
    ['a fractional density', withPatch({ density: 0.5 })],
    ['an unknown font id', withPatch({ fonts: { body: 'comic' } })],
    ['an unknown font role', withPatch({ fonts: { title: 'lora' } })],
    ['a font id with markup', withPatch({ fonts: { heading: '</style><script>window.__pwned=1</script>' } })],
    ['an unknown harmony', withColors({ harmony: 'rainbow' })],
    ['an unknown preset', withColors({ preset: 'neon' })],
    ['an accent index above the harmony range', withColors({ accentIndex: 4 })],
    ['a fractional accent index', withColors({ accentIndex: 1.5 })],
    ['lightness below the range', withColors({ primary: { l: 0.1, c: 0.1, h: 10 } })],
    ['lightness above the range', withColors({ primary: { l: 0.95, c: 0.1, h: 10 } })],
    ['chroma above the range', withColors({ primary: { l: 0.5, c: 0.5, h: 10 } })],
    ['hue above the range', withColors({ primary: { l: 0.5, c: 0.1, h: 361 } })],
    ['a null lightness', withColors({ primary: { l: null, c: 0.1, h: 10 } })],
    ['an extra colour key', withColors({ primary: { l: 0.5, c: 0.1, h: 10, a: 1 } })],
  ];

  it.each(rejected)('returns null for %s', (_label, raw) => {
    expect(parsePersistedTheme(raw)).toBeNull();
  });

  it('returns null for an oversized value without parsing it', () => {
    expect(parsePersistedTheme('x'.repeat(2049))).toBeNull();
  });
});

describe('payload size', () => {
  it('keeps the worst case far below the cookie limit', () => {
    const worst: PersistedTheme = {
      v: 1,
      colors: {
        primary: { l: 0.89999, c: 0.39999, h: 359.99 },
        preset: 'custom',
        harmony: 'split-complementary',
        accentIndex: 3,
      },
      fonts: { heading: 'geist-mono', body: 'geist-mono', code: 'geist-mono' },
      radius: 12,
      density: -3,
      scale: 150,
    };
    const encoded = serializePersistedTheme(worst);

    expect(encoded.length).toBeLessThan(1200);
    expect(parsePersistedTheme(encoded)).toEqual(worst);
  });
});

describe('persistedFromSnapshot', () => {
  it('is null when nothing styleable was applied', () => {
    expect(persistedFromSnapshot({ applied: {}, seed: {} })).toBeNull();
  });

  it('is null when only the mode was applied, because mode has its own cookie', () => {
    expect(
      persistedFromSnapshot({ applied: { mode: 'dark' }, seed: {} }),
    ).toBeNull();
  });

  it('leaves colours out when the seed lacks their inputs', () => {
    const snapshot = {
      applied: { colors: { light: {}, dark: {} }, radius: 6 },
      seed: {},
    };
    expect(persistedFromSnapshot(snapshot)).toEqual({ v: 1, radius: 6 });
  });

  it('keeps only the font roles that were applied', () => {
    const snapshot = { applied: { fonts: { body: 'lora' as const } }, seed: {} };
    expect(persistedFromSnapshot(snapshot)).toEqual({
      v: 1,
      fonts: { body: 'lora' },
    });
  });
});

describe('appliedFromPersisted', () => {
  it('seeds the editor with the saved fonts over the defaults', () => {
    const { seed } = appliedFromPersisted({ v: 1, fonts: { body: 'lora' } });

    expect(seed.fonts).toEqual({ ...DEFAULT_FONTS, body: 'lora' });
  });
});

describe('persistedCss', () => {
  const accentSource = accentSourceFor(violet.color, 'triadic', 2);
  const draft: ThemeDraft = {
    ...base,
    primary: violet.color,
    preset: 'violet',
    harmony: 'triadic',
    accentIndex: 2,
    fonts: { ...DEFAULT_FONTS, body: 'lora' },
    radius: 8,
    density: -2,
    scale: 115,
    tokens: {
      light: resolveTokens(violet.color, accentSource, 'light'),
      dark: resolveTokens(violet.color, accentSource, 'dark'),
    },
  };

  it('builds exactly the CSS the client builds from the same applied draft', () => {
    const changes = changesBetween(base, draft);
    const saved = persistedFromSnapshot({
      applied: changes,
      seed: seedAfter({}, draft, changes),
    });

    expect(saved).not.toBeNull();
    expect(persistedCss(serializePersistedTheme(saved!))).toBe(
      appliedCss(changes),
    );
  });

  it('is empty for no cookie and for anything the parser rejects', () => {
    expect(persistedCss(undefined)).toBe('');
    expect(persistedCss('%7Bbroken')).toBe('');
    expect(persistedCss(withPatch({ radius: 99 }))).toBe('');
  });

  it('is empty, with no markup, for a hostile string in any field', () => {
    const hostile = '</style><script>window.__pwned=1</script>';
    for (const raw of [
      withPatch({ fonts: { heading: hostile } }),
      withColors({ preset: hostile }),
      withColors({ harmony: hostile }),
    ]) {
      expect(persistedCss(raw)).toBe('');
    }
  });

  it('never contains a less-than sign', () => {
    expect(persistedCss(JSON.stringify(full))).not.toContain('<');
    expect(persistedCss(JSON.stringify(full))).toContain('--radius-base:8px');
  });
});

describe('cookie strings', () => {
  it('writes the name, the encoded value and the attributes', () => {
    const cookie = prefsCookieString({ v: 1, radius: 7 }, false);

    expect(cookie.startsWith(`${THEME_PREFS_COOKIE}=`)).toBe(true);
    expect(cookie).toContain('; Path=/; Max-Age=31536000; SameSite=Lax');
    expect(cookie).not.toContain('Secure');
    const value = cookie.slice(THEME_PREFS_COOKIE.length + 1).split(';')[0];
    expect(parsePersistedTheme(value)).toEqual({ v: 1, radius: 7 });
  });

  it('adds Secure on https', () => {
    expect(prefsCookieString({ v: 1, radius: 7 }, true)).toContain('; Secure');
  });

  it('expires the cookie', () => {
    expect(expiredPrefsCookie()).toBe(
      `${THEME_PREFS_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`,
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run apps/web/components/theme/lib/persisted-theme.test.tsx`
Expected: FAIL, cannot resolve `./persisted-theme`.

- [ ] **Step 3: Write minimal implementation**

Create `apps/web/components/theme/lib/persisted-theme.ts`:

```ts
import { DENSITY, RADIUS, SCALE } from './appearance';
import { appliedCss, type AppliedTheme, type ThemeInitial } from './apply';
import {
  COLOR_RANGES,
  HARMONIES,
  PRESETS,
  accentSourceFor,
  resolveTokens,
  tokenVariables,
  type HarmonyId,
  type Oklch,
} from './color-math';
import { DEFAULT_FONTS, fonts, type FontId, type FontRole } from './fonts';

/** Interim name of the cookie that holds the applied theme (not mode, which has its own). */
export const THEME_PREFS_COOKIE = 'theme-prefs';

const COOKIE_MAX_AGE = 31_536_000;
const MAX_RAW_LENGTH = 2048;
const MAX_ACCENT_INDEX = 3;
const ROLES: FontRole[] = ['heading', 'body', 'code'];

/**
 * What is saved: the inputs of what the user applied, never the generated tokens. Only
 * the parts that were applied are present, because the editor's defaults are not the app's.
 */
export type PersistedTheme = {
  v: 1;
  colors?: {
    primary: Oklch;
    preset: string;
    harmony: HarmonyId;
    accentIndex: number | null;
  };
  fonts?: Partial<Record<FontRole, FontId>>;
  radius?: number;
  density?: number;
  scale?: number;
};

/** The parts of the applied record that are saved and rebuilt. */
export type AppliedSnapshot = { applied: AppliedTheme; seed: ThemeInitial };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasOnly = (value: Record<string, unknown>, keys: string[]) =>
  Object.keys(value).every((key) => keys.includes(key));

const inRange = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value >= min &&
  value <= max;

const isInteger = (value: unknown, min: number, max: number): value is number =>
  inRange(value, min, max) && Number.isInteger(value);

/** The server gives the value already decoded; document.cookie gives it encoded. */
function decode(raw: string): string | null {
  if (raw.startsWith('{')) return raw;
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}

function parseColors(value: unknown): PersistedTheme['colors'] | null {
  if (
    !isRecord(value) ||
    !hasOnly(value, ['primary', 'preset', 'harmony', 'accentIndex'])
  ) {
    return null;
  }
  const { primary, preset, harmony, accentIndex } = value;
  if (!isRecord(primary) || !hasOnly(primary, ['l', 'c', 'h'])) return null;
  const { l, c, h } = primary;
  if (!inRange(l, COLOR_RANGES.l.min, COLOR_RANGES.l.max)) return null;
  if (!inRange(c, COLOR_RANGES.c.min, COLOR_RANGES.c.max)) return null;
  if (!inRange(h, COLOR_RANGES.h.min, COLOR_RANGES.h.max)) return null;
  if (
    typeof preset !== 'string' ||
    (preset !== 'custom' && !PRESETS.some((entry) => entry.id === preset))
  ) {
    return null;
  }
  const harmonyId = HARMONIES.find((entry) => entry.id === harmony)?.id;
  if (!harmonyId) return null;
  let accent: number | null = null;
  if (accentIndex !== null) {
    if (!isInteger(accentIndex, 0, MAX_ACCENT_INDEX)) return null;
    accent = accentIndex;
  }
  return {
    primary: { l, c, h },
    preset,
    harmony: harmonyId,
    accentIndex: accent,
  };
}

function parseFonts(value: unknown): PersistedTheme['fonts'] | null {
  if (!isRecord(value) || !hasOnly(value, ROLES)) return null;
  const parsed: Partial<Record<FontRole, FontId>> = {};
  for (const role of ROLES) {
    const id = value[role];
    if (id === undefined) continue;
    const font = fonts.find((entry) => entry.value === id);
    if (!font) return null;
    parsed[role] = font.value;
  }
  return parsed;
}

/**
 * Reads the saved theme from a cookie value, or null if it is missing or anything about it
 * is wrong. It is all or nothing: a half-valid cookie is never partly applied.
 */
export function parsePersistedTheme(
  raw: string | undefined,
): PersistedTheme | null {
  if (!raw || raw.length > MAX_RAW_LENGTH) return null;
  const text = decode(raw);
  if (text === null) return null;
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (
    !isRecord(data) ||
    data.v !== 1 ||
    !hasOnly(data, ['v', 'colors', 'fonts', 'radius', 'density', 'scale'])
  ) {
    return null;
  }
  const { colors, fonts: savedFonts, radius, density, scale } = data;
  const theme: PersistedTheme = { v: 1 };
  if (colors !== undefined) {
    const parsed = parseColors(colors);
    if (!parsed) return null;
    theme.colors = parsed;
  }
  if (savedFonts !== undefined) {
    const parsed = parseFonts(savedFonts);
    if (!parsed) return null;
    theme.fonts = parsed;
  }
  if (radius !== undefined) {
    if (!isInteger(radius, RADIUS.min, RADIUS.max)) return null;
    theme.radius = radius;
  }
  if (density !== undefined) {
    if (!isInteger(density, DENSITY.min, DENSITY.max)) return null;
    theme.density = density;
  }
  if (scale !== undefined) {
    if (
      !isInteger(scale, SCALE.min, SCALE.max) ||
      (scale - SCALE.min) % SCALE.step !== 0
    ) {
      return null;
    }
    theme.scale = scale;
  }
  return Object.keys(theme).length > 1 ? theme : null;
}

export const serializePersistedTheme = (theme: PersistedTheme) =>
  encodeURIComponent(JSON.stringify(theme));

/** What to save for an applied record, or null when nothing styleable is applied. */
export function persistedFromSnapshot({
  applied,
  seed,
}: AppliedSnapshot): PersistedTheme | null {
  const theme: PersistedTheme = { v: 1 };
  if (
    applied.colors &&
    seed.primary &&
    seed.preset !== undefined &&
    seed.harmony !== undefined &&
    seed.accentIndex !== undefined
  ) {
    theme.colors = {
      primary: seed.primary,
      preset: seed.preset,
      harmony: seed.harmony,
      accentIndex: seed.accentIndex,
    };
  }
  const fontEntries = ROLES.flatMap((role) => {
    const id = applied.fonts?.[role];
    return id ? [[role, id] as const] : [];
  });
  if (fontEntries.length) theme.fonts = Object.fromEntries(fontEntries);
  if (applied.radius !== undefined) theme.radius = applied.radius;
  if (applied.density !== undefined) theme.density = applied.density;
  if (applied.scale !== undefined) theme.scale = applied.scale;
  return Object.keys(theme).length > 1 ? theme : null;
}

/** Rebuilds the applied theme, and what the editor should start from, from a saved one. */
export function appliedFromPersisted(theme: PersistedTheme): AppliedSnapshot {
  const applied: AppliedTheme = {};
  const seed: ThemeInitial = {};
  if (theme.colors) {
    const { primary, preset, harmony, accentIndex } = theme.colors;
    const accentSource = accentSourceFor(primary, harmony, accentIndex);
    applied.colors = {
      light: tokenVariables(resolveTokens(primary, accentSource, 'light')),
      dark: tokenVariables(resolveTokens(primary, accentSource, 'dark')),
    };
    seed.primary = primary;
    seed.preset = preset;
    seed.harmony = harmony;
    seed.accentIndex = accentIndex;
  }
  if (theme.fonts) {
    applied.fonts = theme.fonts;
    seed.fonts = { ...DEFAULT_FONTS, ...theme.fonts };
  }
  if (theme.radius !== undefined) {
    applied.radius = theme.radius;
    seed.radius = theme.radius;
  }
  if (theme.density !== undefined) {
    applied.density = theme.density;
    seed.density = theme.density;
  }
  if (theme.scale !== undefined) {
    applied.scale = theme.scale;
    seed.scale = theme.scale;
  }
  return { applied, seed };
}

/**
 * The CSS for a cookie value, for the server to put in the first HTML. Empty for no cookie
 * or a rejected one. Built only from validated numbers and ids from the curated lists; the
 * less-than sign is escaped as well, so nothing can close the style element.
 */
export function persistedCss(raw: string | undefined): string {
  const theme = parsePersistedTheme(raw);
  if (!theme) return '';
  return appliedCss(appliedFromPersisted(theme).applied).replace(
    /</g,
    '\\3c ',
  );
}

export const prefsCookieString = (theme: PersistedTheme, secure: boolean) =>
  `${THEME_PREFS_COOKIE}=${serializePersistedTheme(theme)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure ? '; Secure' : ''}`;

export const expiredPrefsCookie = () =>
  `${THEME_PREFS_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run apps/web/components/theme/lib/persisted-theme.test.tsx && pnpm typecheck`
Expected: PASS and typecheck clean. If Prettier or lint reformat the long `rejected` table, run `pnpm exec prettier --write` on the two files and commit the result.

- [ ] **Step 5: Commit**

```bash
F=(apps/web/components/theme/lib/persisted-theme.ts apps/web/components/theme/lib/persisted-theme.test.tsx)
git add -- "${F[@]}" && git commit -m "feat: add validated persistence for the applied theme" -- "${F[@]}"
```

---

### Task 2: Move the applied record into a subscribable store

Behavior-preserving. Nothing is saved yet; the sheet just reads the store with `useSyncExternalStore`.

**Files:**

- Create: `apps/web/components/theme/lib/applied-store.ts`
- Create: `apps/web/components/theme/lib/applied-store.test.tsx`
- Modify: `apps/web/components/theme/lib/apply.ts` (remove the record block at the end)
- Modify: `apps/web/components/theme/lib/apply.test.tsx` (imports; remove the `the applied record` block)
- Modify: `apps/web/components/theme/components/containers/theme-sheet.tsx`
- Modify: `apps/web/components/theme/components/containers/theme-sheet.test.tsx` (one import)

**Interfaces:**

- Consumes: from `./apply`: `applyToDocument`, `hasChanges`, `mergeApplied`, `removeFromDocument`, `seedAfter`, `AppliedTheme`, `ThemeDraft`, `ThemeInitial`; from `./color-math`: `Mode`.
- Produces:
  - `type AppliedRecord = { applied: AppliedTheme; seed: ThemeInitial; modeBefore: Mode | null; modeApplied: Mode | null }`
  - `subscribeApplied(listener: () => void): () => void`
  - `getAppliedRecord(): AppliedRecord`, `getServerAppliedRecord(): AppliedRecord` (always empty)
  - `hasApplied(current: AppliedRecord): boolean`
  - `recordApply(changes: AppliedTheme, draft: ThemeDraft, currentMode: Mode | null): AppliedRecord`
  - `clearApplied(): AppliedRecord`

- [ ] **Step 1: Write the failing test**

Create `apps/web/components/theme/lib/applied-store.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest';
import { APPLIED_STYLE_ID, type ThemeDraft } from './apply';
import {
  clearApplied,
  getAppliedRecord,
  getServerAppliedRecord,
  hasApplied,
  recordApply,
  subscribeApplied,
} from './applied-store';
import { DEFAULT_TOKENS, PRESETS } from './color-math';
import { DEFAULT_FONTS } from './fonts';

const blue = PRESETS.find((p) => p.id === 'blue')!;

const base: ThemeDraft = {
  mode: 'light',
  primary: blue.color,
  preset: blue.id,
  harmony: 'analogous',
  accentIndex: 1,
  scale: 100,
  fonts: DEFAULT_FONTS,
  radius: 4,
  density: 0,
  tokens: DEFAULT_TOKENS,
};

afterEach(() => {
  clearApplied();
  document.getElementById(APPLIED_STYLE_ID)?.remove();
});

describe('the applied record', () => {
  it('starts empty and is not applied', () => {
    expect(hasApplied(getAppliedRecord())).toBe(false);
  });

  it('keeps the mode from before the first Apply, not the one before the latest', () => {
    const dark = { ...base, mode: 'dark' as const };
    recordApply({ mode: 'dark' }, dark, 'light');
    recordApply({ mode: 'system' }, { ...dark, mode: 'system' }, 'dark');

    const record = getAppliedRecord();

    expect(record.modeBefore).toBe('light');
    expect(record.modeApplied).toBe('system');
  });

  it('writes the page and seeds the editor, and clearing undoes both', () => {
    recordApply({ radius: 7 }, { ...base, radius: 7 }, null);

    expect(document.getElementById(APPLIED_STYLE_ID)?.textContent).toBe(
      ':root{--radius-base:7px}',
    );
    expect(getAppliedRecord().seed.radius).toBe(7);

    clearApplied();

    expect(document.getElementById(APPLIED_STYLE_ID)).toBeNull();
    expect(hasApplied(getAppliedRecord())).toBe(false);
  });
});

describe('subscribing', () => {
  it('tells subscribers about every change, and stops after unsubscribing', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeApplied(listener);

    recordApply({ radius: 7 }, { ...base, radius: 7 }, null);
    clearApplied();
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    recordApply({ radius: 8 }, { ...base, radius: 8 }, null);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('returns the same record object until something changes', () => {
    expect(getAppliedRecord()).toBe(getAppliedRecord());

    recordApply({ radius: 7 }, { ...base, radius: 7 }, null);
    const applied = getAppliedRecord();

    expect(getAppliedRecord()).toBe(applied);
  });

  it('gives the server an empty record even when the client has one applied', () => {
    recordApply({ radius: 7 }, { ...base, radius: 7 }, null);

    expect(hasApplied(getAppliedRecord())).toBe(true);
    expect(hasApplied(getServerAppliedRecord())).toBe(false);
    expect(getServerAppliedRecord()).toBe(getServerAppliedRecord());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run apps/web/components/theme/lib/applied-store.test.tsx`
Expected: FAIL, cannot resolve `./applied-store`.

- [ ] **Step 3: Create the store and remove the record from `apply.ts`**

Create `apps/web/components/theme/lib/applied-store.ts`:

```ts
import {
  applyToDocument,
  hasChanges,
  mergeApplied,
  removeFromDocument,
  seedAfter,
  type AppliedTheme,
  type ThemeDraft,
  type ThemeInitial,
} from './apply';
import type { Mode } from './color-math';

/**
 * Everything applied so far, kept outside any component so it survives the sheet being
 * remounted (a header that re-renders, a route change). It is only ever written from
 * client event handlers, so the server never holds state between requests; the server
 * reads a snapshot that is always empty.
 */
export type AppliedRecord = {
  applied: AppliedTheme;
  /** What the editor should start from. */
  seed: ThemeInitial;
  /** The mode before the first Apply that changed it, and the mode that Apply set. */
  modeBefore: Mode | null;
  modeApplied: Mode | null;
};

const EMPTY_RECORD: AppliedRecord = {
  applied: {},
  seed: {},
  modeBefore: null,
  modeApplied: null,
};
let record = EMPTY_RECORD;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

export function subscribeApplied(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getAppliedRecord = () => record;

/** What the server renders: nothing is applied until the client says so. */
export const getServerAppliedRecord = () => EMPTY_RECORD;

export const hasApplied = (current: AppliedRecord) =>
  hasChanges(current.applied) || current.modeApplied !== null;

/** Writes one Apply into the page and the record. */
export function recordApply(
  changes: AppliedTheme,
  draft: ThemeDraft,
  currentMode: Mode | null,
): AppliedRecord {
  const applied = mergeApplied(record.applied, changes);
  applyToDocument(applied);
  record = {
    applied,
    seed: seedAfter(record.seed, draft, changes),
    modeBefore: changes.mode
      ? (record.modeBefore ?? currentMode)
      : record.modeBefore,
    modeApplied: changes.mode ?? record.modeApplied,
  };
  emit();
  return record;
}

/** Takes everything back out of the page and forgets it. */
export function clearApplied(): AppliedRecord {
  removeFromDocument();
  record = EMPTY_RECORD;
  emit();
  return record;
}
```

Remove the record block from the end of `apply.ts` (everything from the doc comment `Everything applied so far` to the end of the file):

```bash
f=apps/web/components/theme/lib/apply.ts
n=$(rg -n "^ \* Everything applied so far" $f | cut -d: -f1)
head -n $((n-3)) $f > "$TMPDIR/apply.ts" && mv "$TMPDIR/apply.ts" $f
tail -n 6 $f
```

Expected: the file now ends with the closing `}` of `seedAfter`. If the last lines are not that, restore with `git checkout -- $f` and redo with the correct offset. Then remove the stale `hasChanges`-only usages if lint reports any unused import in `apply.ts`.

Update `apply.test.tsx` (three edits):

1. In the `./apply` import list, replace

```ts
  applyToDocument,
  clearApplied,
  getAppliedRecord,
  hasApplied,
  recordApply,
  changesBetween,
```

with

```ts
  applyToDocument,
  changesBetween,
```

1. After `import { DEFAULT_FONTS } from './fonts';` add:

```ts
import { clearApplied } from './applied-store';
```

1. Delete the whole `describe('the applied record', …)` block (the three tests now live in `applied-store.test.tsx`), from `describe('the applied record', () => {` through its closing `});` just before `describe('transitions while a theme is applied'`.

Update the sheet test import in `theme-sheet.test.tsx`:

```ts
import { clearApplied } from '../../lib/applied-store';
```

(replacing `import { clearApplied } from '../../lib/apply';`).

Update `theme-sheet.tsx`:

```tsx
// replace
import { useCallback, useContext, useEffect, useId, useState } from 'react';
// with
import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
} from 'react';
```

```tsx
// replace the whole lib/apply import block with
import {
  changesBetween,
  draftKey,
  hasChanges,
  type ThemeDraft,
} from '../../lib/apply';
import {
  clearApplied,
  getAppliedRecord,
  getServerAppliedRecord,
  hasApplied,
  recordApply,
  subscribeApplied,
} from '../../lib/applied-store';
```

```tsx
// replace
  const [record, setRecord] = useState(getAppliedRecord);
// with
  const record = useSyncExternalStore(
    subscribeApplied,
    getAppliedRecord,
    getServerAppliedRecord,
  );
```

```tsx
// replace
    setRecord(recordApply(changes, draft, theme?.mode ?? null));
// with
    recordApply(changes, draft, theme?.mode ?? null);
```

```tsx
// replace
    setRecord(clearApplied());
// with
    clearApplied();
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run apps/web/components/theme && pnpm typecheck && pnpm lint`
Expected: PASS everywhere (the store tests, the trimmed `apply.test.tsx`, and every existing sheet test unchanged in behavior). Fix any unused import lint reports in `apply.ts` or `apply.test.tsx`.

- [ ] **Step 5: Commit**

```bash
F=(apps/web/components/theme/lib/applied-store.ts apps/web/components/theme/lib/applied-store.test.tsx apps/web/components/theme/lib/apply.ts apps/web/components/theme/lib/apply.test.tsx apps/web/components/theme/components/containers/theme-sheet.tsx apps/web/components/theme/components/containers/theme-sheet.test.tsx)
git add -- "${F[@]}" && git commit -m "refactor: move the applied record into a subscribable store" -- "${F[@]}"
```

---

### Task 3: Save and restore the applied theme in the store

**Files:**

- Modify: `apps/web/components/theme/lib/applied-store.ts`
- Modify: `apps/web/components/theme/lib/applied-store.test.tsx`
- Modify: `apps/web/components/theme/lib/apply.ts` (one comment)
- Modify: `apps/web/components/theme/components/containers/theme-sheet.tsx` (status copy)
- Modify: `apps/web/components/theme/components/containers/theme-sheet.test.tsx` (copy test, new reload test)

**Interfaces:**

- Consumes: `THEME_PREFS_COOKIE`, `appliedFromPersisted`, `expiredPrefsCookie`, `parsePersistedTheme`, `persistedFromSnapshot`, `prefsCookieString`, `serializePersistedTheme` from `./persisted-theme` (Task 1).
- Produces: `hydrateApplied(raw?: string): void` — replaces the record with the saved theme (or empty) and notifies subscribers; with no argument it reads `document.cookie`. `getAppliedRecord`, `recordApply` and `clearApplied` also load the cookie once, lazily, on the first call in a browser.

- [ ] **Step 1: Write the failing tests**

In `applied-store.test.tsx`, extend the imports and add the helpers:

```tsx
import {
  clearApplied,
  getAppliedRecord,
  getServerAppliedRecord,
  hasApplied,
  hydrateApplied,
  recordApply,
  subscribeApplied,
} from './applied-store';
import {
  THEME_PREFS_COOKIE,
  parsePersistedTheme,
  serializePersistedTheme,
  type PersistedTheme,
} from './persisted-theme';

const savedCookie = () =>
  document.cookie.match(
    new RegExp(`(?:^|; )${THEME_PREFS_COOKIE}=([^;]*)`),
  )?.[1];
const save = (theme: PersistedTheme) => {
  document.cookie = `${THEME_PREFS_COOKIE}=${serializePersistedTheme(theme)}; Path=/`;
};
```

Append these tests:

```tsx
describe('saving', () => {
  it('writes what was applied to the theme-prefs cookie', () => {
    recordApply({ radius: 7 }, { ...base, radius: 7 }, null);

    expect(parsePersistedTheme(savedCookie())).toEqual({ v: 1, radius: 7 });
  });

  it('merges a later Apply into the saved theme', () => {
    recordApply({ radius: 7 }, { ...base, radius: 7 }, null);
    recordApply({ density: 2 }, { ...base, radius: 7, density: 2 }, null);

    expect(parsePersistedTheme(savedCookie())).toEqual({
      v: 1,
      radius: 7,
      density: 2,
    });
  });

  it('writes nothing for an Apply that changed only the mode', () => {
    recordApply(
      { mode: 'dark' },
      { ...base, mode: 'dark' as const },
      'light',
    );

    expect(savedCookie()).toBeUndefined();
  });

  it('keeps a saved theme when a later Apply changes only the mode', () => {
    recordApply({ radius: 7 }, { ...base, radius: 7 }, null);
    recordApply(
      { mode: 'dark' },
      { ...base, radius: 7, mode: 'dark' as const },
      'light',
    );

    expect(parsePersistedTheme(savedCookie())).toEqual({ v: 1, radius: 7 });
  });

  it('expires the cookie when everything is cleared', () => {
    recordApply({ radius: 7 }, { ...base, radius: 7 }, null);

    clearApplied();

    expect(savedCookie()).toBeUndefined();
  });
});

describe('restoring', () => {
  it('rebuilds the record from a saved theme without touching the page', () => {
    const style = document.createElement('style');
    style.id = APPLIED_STYLE_ID;
    style.textContent = ':root{--radius-base:7px}';
    document.head.appendChild(style);
    save({ v: 1, radius: 7, scale: 115 });

    hydrateApplied();

    const record = getAppliedRecord();
    expect(record.applied).toEqual({ radius: 7, scale: 115 });
    expect(record.seed).toEqual({ radius: 7, scale: 115 });
    expect(record.modeBefore).toBeNull();
    expect(hasApplied(record)).toBe(true);
    expect(style.textContent).toBe(':root{--radius-base:7px}');
  });

  it('starts empty for a corrupt cookie', () => {
    document.cookie = `${THEME_PREFS_COOKIE}=%7Bbroken; Path=/`;

    hydrateApplied();

    expect(hasApplied(getAppliedRecord())).toBe(false);
    document.cookie = `${THEME_PREFS_COOKIE}=; Max-Age=0; Path=/`;
  });

  it('tells subscribers when it loads a saved theme', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeApplied(listener);
    save({ v: 1, radius: 7 });

    hydrateApplied();

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('reads the cookie the first time the record is read', async () => {
    save({ v: 1, radius: 7 });
    vi.resetModules();

    const fresh = await import('./applied-store');

    expect(fresh.getAppliedRecord().applied.radius).toBe(7);
  });

  it('merges a new Apply into a theme saved by an earlier visit', async () => {
    save({ v: 1, radius: 7 });
    vi.resetModules();
    const fresh = await import('./applied-store');

    fresh.recordApply({ density: 2 }, { ...base, density: 2 }, null);

    expect(parsePersistedTheme(savedCookie())).toEqual({
      v: 1,
      radius: 7,
      density: 2,
    });
  });

  it('clears the saved cookie and the page after a reload, leaving mode alone', () => {
    const style = document.createElement('style');
    style.id = APPLIED_STYLE_ID;
    document.head.appendChild(style);
    save({ v: 1, radius: 7 });
    hydrateApplied();

    const cleared = clearApplied();

    expect(document.getElementById(APPLIED_STYLE_ID)).toBeNull();
    expect(savedCookie()).toBeUndefined();
    expect(cleared.modeBefore).toBeNull();
    expect(cleared.modeApplied).toBeNull();
  });
});
```

In `theme-sheet.test.tsx`:

1. Add imports (next to the existing ones):

```tsx
import { hydrateApplied } from '../../lib/applied-store';
import {
  THEME_PREFS_COOKIE,
  serializePersistedTheme,
} from '../../lib/persisted-theme';
```

1. Rename and update the existing copy test (it currently expects `Applied until reload.`):

```tsx
    it('applies the mode to the app and says it was applied', () => {
      openSheet();
      makeAnEdit();

      fireEvent.click(apply());

      expect(document.documentElement).toHaveClass('dark');
      expect(status()).toHaveTextContent('Applied.');
      expect(apply()).toBeDisabled();
    });
```

1. Add inside the top-level `describe('ThemeSheet', …)` (a sibling of the existing `describe` blocks):

```tsx
  it('offers to revert a theme saved by an earlier visit, and reverting forgets it', async () => {
    document.cookie = `${THEME_PREFS_COOKIE}=${serializePersistedTheme({ v: 1, radius: 7 })}; Path=/`;
    hydrateApplied();
    openSheet();

    expect(moreActions()).not.toBeNull();
    choose('Revert applied changes');
    fireEvent.click(screen.getByRole('button', { name: 'Revert' }));

    await waitFor(() => expect(moreActions()).toBeNull());
    expect(document.cookie).not.toContain(THEME_PREFS_COOKIE);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run apps/web/components/theme/lib/applied-store.test.tsx apps/web/components/theme/components/containers/theme-sheet.test.tsx`
Expected: FAIL: `hydrateApplied` is not exported, and the copy test still sees `Applied until reload.`.

- [ ] **Step 3: Write the implementation**

In `applied-store.ts`, add the import:

```ts
import {
  THEME_PREFS_COOKIE,
  appliedFromPersisted,
  expiredPrefsCookie,
  parsePersistedTheme,
  persistedFromSnapshot,
  prefsCookieString,
} from './persisted-theme';
```

Replace the doc comment above `AppliedRecord` with:

```ts
/**
 * Everything applied so far, kept outside any component so it survives the sheet being
 * remounted. What was applied is also saved in a cookie (see persisted-theme.ts), so it
 * survives a reload and the server can render it. The store is only ever written from
 * client event handlers, so the server never holds state between requests; the server
 * reads a snapshot that is always empty.
 */
```

Replace `getAppliedRecord`, `recordApply` and `clearApplied` and add the cookie helpers, so the block from `let record = EMPTY_RECORD;` downward reads:

```ts
let record = EMPTY_RECORD;
let loaded = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

const readPrefsCookie = () =>
  document.cookie.match(
    new RegExp(`(?:^|; )${THEME_PREFS_COOKIE}=([^;]*)`),
  )?.[1];

/** Replaces the record with the saved theme, or with nothing. Does not notify. */
function load(raw: string | undefined) {
  const theme = parsePersistedTheme(raw);
  record = theme ? { ...EMPTY_RECORD, ...appliedFromPersisted(theme) } : EMPTY_RECORD;
  loaded = true;
}

/** Reads the cookie once, the first time the record is needed in a browser. */
function ensureLoaded() {
  if (!loaded && typeof document !== 'undefined') load(readPrefsCookie());
}

/** Writes the saved theme, or expires the cookie when nothing styleable is applied. */
function saveCookie() {
  const theme = persistedFromSnapshot(record);
  document.cookie = theme
    ? prefsCookieString(theme, location.protocol === 'https:')
    : expiredPrefsCookie();
}

export function subscribeApplied(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAppliedRecord() {
  ensureLoaded();
  return record;
}

/** What the server renders: nothing is applied until the client says so. */
export const getServerAppliedRecord = () => EMPTY_RECORD;

export const hasApplied = (current: AppliedRecord) =>
  hasChanges(current.applied) || current.modeApplied !== null;

/**
 * Loads a saved theme into the record without touching the page: the server already
 * rendered its styles. With no argument it reads the cookie.
 */
export function hydrateApplied(raw: string | undefined = readPrefsCookie()) {
  load(raw);
  emit();
}

/** Writes one Apply into the page, the record and the cookie. */
export function recordApply(
  changes: AppliedTheme,
  draft: ThemeDraft,
  currentMode: Mode | null,
): AppliedRecord {
  ensureLoaded();
  const applied = mergeApplied(record.applied, changes);
  applyToDocument(applied);
  record = {
    applied,
    seed: seedAfter(record.seed, draft, changes),
    modeBefore: changes.mode
      ? (record.modeBefore ?? currentMode)
      : record.modeBefore,
    modeApplied: changes.mode ?? record.modeApplied,
  };
  saveCookie();
  emit();
  return record;
}

/** Takes everything back out of the page and the cookie, and forgets it. */
export function clearApplied(): AppliedRecord {
  removeFromDocument();
  record = EMPTY_RECORD;
  loaded = true;
  document.cookie = expiredPrefsCookie();
  emit();
  return record;
}
```

In `apply.ts`, replace the comment

```ts
/** Writes the applied theme into the page. It lasts until reload; nothing is stored. */
```

with

```ts
/** Writes the applied theme into the page. Saving it is the applied store's job. */
```

In `theme-sheet.tsx`, replace `'Applied until reload.'` with `'Applied.'` in the `status` expression.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run apps/web/components/theme && pnpm typecheck && pnpm lint`
Expected: PASS. If Prettier asks for formatting in `applied-store.ts` (the `load` line is long), run `pnpm exec prettier --write` on the touched files first.

- [ ] **Step 5: Commit**

```bash
F=(apps/web/components/theme/lib/applied-store.ts apps/web/components/theme/lib/applied-store.test.tsx apps/web/components/theme/lib/apply.ts apps/web/components/theme/components/containers/theme-sheet.tsx apps/web/components/theme/components/containers/theme-sheet.test.tsx)
git add -- "${F[@]}" && git commit -m "feat: save the applied theme and restore it on load" -- "${F[@]}"
```

---

### Task 4: The server renders the saved theme into the first HTML

**Files:**

- Modify: `apps/web/app/layout.tsx`
- Create: `apps/web/tests/theme-prefs.spec.ts`

**Interfaces:**

- Consumes: `APPLIED_STYLE_ID` from `../components/theme/lib/apply`; `THEME_PREFS_COOKIE`, `persistedCss` from `../components/theme/lib/persisted-theme`.

- [ ] **Step 1: Write the failing test**

Create `apps/web/tests/theme-prefs.spec.ts`:

```ts
import { expect, test, type APIRequestContext } from '@playwright/test';

// The applied theme is saved in the theme-prefs cookie. The server must put it in the
// first HTML, ignore a bad cookie completely, and never let the cookie inject markup.

const STYLE_ID = 'synapcity-applied-theme';
const encoded = (value: unknown) => encodeURIComponent(JSON.stringify(value));
const cookieHeader = (value: unknown) => `theme-prefs=${encoded(value)}`;
const styleBody = (html: string) =>
  html.match(
    new RegExp(`<style[^>]*id="${STYLE_ID}"[^>]*>([^<]*)</style>`),
  )?.[1];

async function pageHtml(request: APIRequestContext, cookie?: string) {
  const response = await request.get('/home', {
    headers: cookie ? { cookie } : {},
  });
  expect(response.ok()).toBe(true);
  return response.text();
}

test('the server renders a saved theme into the first HTML', async ({
  request,
}) => {
  const html = await pageHtml(request, cookieHeader({ v: 1, radius: 7 }));

  expect(styleBody(html)).toContain('--radius-base:7px');
});

test('with no cookie the style element is there and empty', async ({
  request,
}) => {
  expect(styleBody(await pageHtml(request))).toBe('');
});

const bad: [string, string][] = [
  ['text that is not JSON', 'theme-prefs=%7Bnot-json'],
  ['a radius out of range', cookieHeader({ v: 1, radius: 99 })],
  ['a different version', cookieHeader({ v: 2, radius: 7 })],
  [
    'markup in a font id',
    cookieHeader({
      v: 1,
      fonts: { heading: '</style><script>window.__pwned=1</script>' },
    }),
  ],
];

for (const [label, cookie] of bad) {
  test(`a cookie with ${label} is ignored whole`, async ({ request }) => {
    const html = await pageHtml(request, cookie);

    expect(styleBody(html)).toBe('');
    expect(html).not.toContain('__pwned');
  });
}

test('a saved theme is painted before the app runs', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext();
  await context.addCookies([
    { name: 'theme-prefs', value: encoded({ v: 1, radius: 7 }), url: baseURL! },
  ]);
  const page = await context.newPage();
  await page.route('**/_next/static/**', (route) => route.abort());

  await page.goto('/home');

  await expect
    .poll(() =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--radius-base')
          .trim(),
      ),
    )
    .toBe('7px');
  await context.close();
});

test('hydration keeps exactly one style element with the saved theme', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext();
  await context.addCookies([
    { name: 'theme-prefs', value: encoded({ v: 1, radius: 7 }), url: baseURL! },
  ]);
  const page = await context.newPage();

  await page.goto('/home');
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();

  const styles = await page.evaluate(
    (id) =>
      Array.from(document.querySelectorAll(`#${id}`)).map(
        (element) => element.textContent,
      ),
    STYLE_ID,
  );
  expect(styles).toHaveLength(1);
  expect(styles[0]).toContain('--radius-base:7px');
  await context.close();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run (sandbox disabled): `pnpm --filter @synapcity/web exec playwright test tests/theme-prefs.spec.ts --reporter=list`
Expected: FAIL: the style element does not exist yet, so the first-HTML, empty-element and paint tests fail. The "ignored whole" tests fail on `styleBody(html)` being `undefined`.

- [ ] **Step 3: Write minimal implementation**

In `apps/web/app/layout.tsx`, add imports below the existing `@synapcity/frontend-ui/core` import:

```tsx
import { APPLIED_STYLE_ID } from '../components/theme/lib/apply';
import {
  THEME_PREFS_COOKIE,
  persistedCss,
} from '../components/theme/lib/persisted-theme';
```

After the `initialModePreference` constant add:

```tsx
  const prefsCss = persistedCss(cookieStore.get(THEME_PREFS_COOKIE)?.value);
```

Change the `<head>` to:

```tsx
      <head>
        <InlineScript html={THEME_INIT_SCRIPT} />
        <style
          id={APPLIED_STYLE_ID}
          dangerouslySetInnerHTML={{ __html: prefsCss }}
        />
      </head>
```

The element is always rendered, even when empty, so there is exactly one for the client to update.

- [ ] **Step 4: Run test to verify it passes**

Run (sandbox disabled): `pnpm --filter @synapcity/web exec playwright test tests/theme-prefs.spec.ts tests/theme-mode.spec.ts --reporter=list`
Expected: PASS.

Contingency, only if "a saved theme is painted before the app runs" fails with a value other than `7px` while the first-HTML test passes: the style sits before Next's global stylesheet in `<head>` and loses on source order. Move the element out of `<head>` to the end of `<body>` (after `</RootProviders>`), keep the same props, and rerun. If hydration then reports a mismatch, add `suppressHydrationWarning` to the `<style>`.

Open item from the spec (React and the style element): the hydration test above is the check. If it reports two elements or an empty one, stop and report instead of working around it.

Also run: `pnpm typecheck && pnpm lint`. Expected: clean.

- [ ] **Step 5: Commit**

```bash
F=(apps/web/app/layout.tsx apps/web/tests/theme-prefs.spec.ts)
git add -- "${F[@]}" && git commit -m "feat: render the saved theme into the first HTML" -- "${F[@]}"
```

---

### Task 5: Record the decision and verify the repository

**Files:**

- Modify: `docs/architecture/decisions/0016-theme-shape-and-functionality.md`

- [ ] **Step 1: Amend ADR-0016**

Read the file first (`Read` the "Structure" and "What this does NOT decide" sections), then make two replacements.

In "Structure", replace the whole bullet that begins `- Interim behavior, until persistence is decided:` with:

```txt
- Apply is global only. It writes only the controls the user changed, because the
  editor's defaults are not the app's. Colors are written per mode (`:root.light`
  and `:root.dark`), fonts as `--font-preference-*`, radius as `--radius-base`,
  density as `--spacing` (Tailwind's spacing base, scaled by one factor), text
  size as `--text-base-size` (the 0.875rem the type ladder derives from, scaled
  by the percentage), and mode through the existing theme provider. What was
  applied, except mode, is saved in one versioned cookie, `theme-prefs` (interim
  name, payload version 1), and the server renders the same styles into the first
  HTML. Mode keeps its own cookie, `theme`. Reopening the editor starts from what
  was applied, and the sheet can revert everything it applied; after a reload,
  revert clears the saved theme but does not change mode.
```

In "What this does NOT decide", replace the bullet that begins `- Persistence: where each value is stored` with:

```txt
- Persistence beyond the global applied theme. The applied theme is saved in the
  `theme-prefs` cookie only: local storage cannot reach the first HTML, so it is
  not used. Named themes and their assignments in a per-user database are not
  decided and depend on storage and auth architecture that is not accepted. Keys
  beyond `theme` and `theme-prefs`, and any sync rule, need approval under
  `AGENTS.md` §5.
```

- [ ] **Step 2: Check the docs**

Run: `pnpm docs:check && pnpm exec prettier --check docs/architecture/decisions/0016-theme-shape-and-functionality.md`
Expected: both pass.

- [ ] **Step 3: Commit the ADR**

```bash
F=(docs/architecture/decisions/0016-theme-shape-and-functionality.md)
git add -- "${F[@]}" && git commit -m "docs: record the applied theme persistence in ADR-0016" -- "${F[@]}"
```

- [ ] **Step 4: Run every stage and compare with the known baseline**

Run each stage separately and record the exit code (sandbox disabled):

```bash
for c in format:check lint typecheck test test:storybook test:smoke deps deps:boundaries docs:check build; do pnpm $c > "$TMPDIR/v-$c.txt" 2>&1; echo "$c exit=$?"; done
```

Expected:

- pass: `format:check`, `lint`, `typecheck`, `test`, `docs:check`, `build`.
- fail exactly as before this plan: `test:storybook` (the 3 text-scale stories), `test:smoke` (the 4 listed in Global Constraints; every `theme-prefs` and `theme-mode` test passes), `deps`, `deps:boundaries` (13 `no-circular` + 1 `not-to-unresolved`).

Then prove the new files are not among the findings:

```bash
rg -n "persisted-theme|applied-store|theme-prefs|layout\.tsx" "$TMPDIR/v-deps.txt" "$TMPDIR/v-deps:boundaries.txt"
rg -c "^  error no-circular" "$TMPDIR/v-deps:boundaries.txt"
```

Expected: the first prints nothing; the second prints `13`. Any other result means this plan introduced a finding: stop and fix it.

- [ ] **Step 5: Report**

State, per `AGENTS.md` §9: what changed and why it landed where it did; that the cookie name `theme-prefs`, payload version 1, cookie-only persistence and server-side rendering were approved by the owner and are recorded in ADR-0016 (still Proposed); the exact stages run with exit codes; the stages that fail and that each failure matches the baseline; that the manual check (apply a theme in a visible browser, reload, watch for a flash of the default look) was not run unless it was; and what stays undecided (named themes, database, scoped overrides, local storage, text-scale path, mode controls in the sidebar). Also state one known gap: the soft-navigation case (a client-side route change after an Apply) has no automated test, because the app has no stable in-app link to drive it.

---

## Self-review

- **Spec coverage:** payload and validation → Task 1; store, no dependency, server snapshot empty, write only from client → Tasks 2–3; cookie write/expire and hydration → Task 3; server-rendered style → Task 4; sheet integration and copy → Tasks 2–3; mode untouched → Task 3 tests (mode-only Apply writes nothing; saved theme survives a mode-only Apply); security (hostile string, `<` escape, whole-reject) → Tasks 1 and 4; size budget → Task 1; ADR amendment → Task 5. Open items: React vs the style element → Task 4 hydration test and contingency; exact colour bounds → read from `COLOR_RANGES` in Task 1; size budget → Task 1; sidebar mode control → explicitly out of scope.
- **Placeholders:** none; every code step has code. The only runtime-resolved value is the `head -n` offset in Task 2 Step 3, produced by a command with a stated expected result.
- **Type consistency:** `AppliedSnapshot`, `PersistedTheme`, `parsePersistedTheme`, `persistedFromSnapshot`, `appliedFromPersisted`, `persistedCss`, `prefsCookieString`, `expiredPrefsCookie`, `THEME_PREFS_COOKIE`, `hydrateApplied`, `getServerAppliedRecord`, `subscribeApplied` use the same names and signatures in every task.
