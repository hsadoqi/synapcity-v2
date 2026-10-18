# Theme mode provider consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One canonical `ThemeProvider` owns light / dark / system mode, applies it before first paint, and persists it under one cookie name; `DarkModeProvider` is archived.

**Architecture:** `ThemeProvider` (already mounted by `apps/web`) stays the runtime owner. A static pre-paint script, exported from `ui-core` beside it and rendered in the root layout through the existing `InlineScript` block, sets the class before first paint. The cookie name lives in one constant read by the provider, the script and the layout. The `dark-mode` block moves onto `useThemeMode`, then `DarkModeProvider` moves to `docs/archive/`.

**Tech Stack:** React 19.3, Next.js 16.3 App Router, Vitest 5 + Testing Library (jsdom), Playwright smoke, pnpm workspaces.

**Spec:** `docs/superpowers/specs/2026-10-10-theme-mode-provider-consolidation-design.md`

## Global Constraints

- Interim mode cookie name is `theme`; `Path=/`, `Max-Age=31536000`, `SameSite=Lax`, `Secure` on https.
- No new dependency (no `next-themes`).
- The script is a static string; no user value is interpolated; the cookie value is checked against `light` / `dark`.
- Archive, never delete, `DarkModeProvider`.
- No renaming of `ThemeProvider`, its hooks, or the `DarkMode*` toggle types (naming goes through `docs/glossary.md`).
- No store, no other persistence keys, no colour work (sub-projects B–E).
- Commits are one subject line, `type: short summary`, types `chore|feat|fix|docs|refactor|test`; no body, no trailers; no GitHub closing keyword near an issue reference.
- Components import no application runtime (ADR-0008); exports-only public API (ADR-0005).
- Run commands from the repository root: `/Users/hanaasadoqi/Projects/active/synapcity/active/ai-synapcity.worktrees/feat-theming-system`.

## Review Focus

Failure modes the spec implies, most likely first. Each has a test in the task that owns the code.

1. A lookalike cookie (`xtheme=light`) or other cookies around `theme` must not change the mode. Task 1.
2. An unknown cookie value (`sepia`) must behave like no preference (follow the device), not break or pick a stray class. Task 1.
3. `matchMedia` missing or throwing must not throw out of the inline script or leave a half-set class. Task 1.
4. An explicit light or dark choice must ignore later system-preference changes. Task 2.
5. Before the client reads the system preference, `resolvedMode` is `null`; the toggle label must not read "system (null)". Task 3.

---

### Task 1: Cookie constant and pre-paint script

**Files:**

- Create: `packages/ui/core/src/providers/theme-init-script.ts`
- Create: `packages/ui/core/src/providers/theme-init-script.test.ts`
- Modify: `packages/ui/core/src/providers/index.ts`

**Interfaces:**

- Produces: `THEME_COOKIE: 'theme'` and `THEME_INIT_SCRIPT: string` (an immediately-invoked function expression), both exported from `@synapcity/frontend-ui/core` through `providers/index.ts`.

- [ ] **Step 1: Write the failing test**

Create `packages/ui/core/src/providers/theme-init-script.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_COOKIE, THEME_INIT_SCRIPT } from './theme-init-script';

const run = () => new Function(THEME_INIT_SCRIPT)();
const root = () => document.documentElement;

function stubSystem(dark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: dark })),
  );
}

const clearCookie = () => {
  document.cookie = `${THEME_COOKIE}=; Max-Age=0; Path=/`;
  document.cookie = 'xtheme=; Max-Age=0; Path=/';
  document.cookie = 'other=; Max-Age=0; Path=/';
};

beforeEach(() => {
  root().className = '';
  clearCookie();
});

afterEach(() => {
  vi.unstubAllGlobals();
  root().className = '';
  clearCookie();
});

describe('THEME_COOKIE', () => {
  it('is the interim mode cookie name', () => {
    expect(THEME_COOKIE).toBe('theme');
  });
});

describe('THEME_INIT_SCRIPT', () => {
  it.each([
    ['dark', false, 'dark'],
    ['light', true, 'light'],
    ['system', true, 'dark'],
    ['system', false, 'light'],
  ])('cookie %s with system dark=%s sets %s', (cookie, systemDark, expected) => {
    document.cookie = `${THEME_COOKIE}=${cookie}; Path=/`;
    stubSystem(systemDark);

    run();

    expect(root().className).toBe(expected);
  });

  it('follows the device when there is no cookie', () => {
    stubSystem(true);

    run();

    expect(root().className).toBe('dark');
  });

  it('treats an unknown cookie value as no preference', () => {
    document.cookie = `${THEME_COOKIE}=sepia; Path=/`;
    stubSystem(true);

    run();

    expect(root().className).toBe('dark');
  });

  it('reads the theme cookie among other cookies', () => {
    document.cookie = 'other=1; Path=/';
    document.cookie = `${THEME_COOKIE}=dark; Path=/`;
    stubSystem(false);

    run();

    expect(root().className).toBe('dark');
  });

  it('ignores a cookie whose name merely ends in theme', () => {
    document.cookie = 'xtheme=dark; Path=/';
    stubSystem(false);

    run();

    expect(root().className).toBe('light');
  });

  it('replaces a stale mode class and keeps unrelated classes', () => {
    root().className = 'light geist-font';
    document.cookie = `${THEME_COOKIE}=dark; Path=/`;
    stubSystem(false);

    run();

    expect(root().classList.contains('dark')).toBe(true);
    expect(root().classList.contains('light')).toBe(false);
    expect(root().classList.contains('geist-font')).toBe(true);
  });

  it('does not throw when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined);

    expect(run).not.toThrow();
    expect(root().className).toBe('');
  });

  it('interpolates nothing but the cookie name', () => {
    expect(THEME_INIT_SCRIPT).not.toContain('${');
    expect(THEME_INIT_SCRIPT).toContain(THEME_COOKIE);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run packages/ui/core/src/providers/theme-init-script.test.ts`
Expected: FAIL, cannot resolve `./theme-init-script`. If Vitest reports no matching test files, run `pnpm test` once and read which project owns `packages/ui/core`, then pass `--project <name>`.

- [ ] **Step 3: Write minimal implementation**

Create `packages/ui/core/src/providers/theme-init-script.ts`:

```ts
/** Interim name of the cookie that holds the mode preference. Persistence keys are decided later (ADR-0016). */
export const THEME_COOKIE = 'theme';

/**
 * Runs before first paint and puts `light` or `dark` on <html>, so a reload does not flash the
 * wrong mode. Anything other than an explicit `light` / `dark` cookie follows the device. It is a
 * constant authored in code (see InlineScript); the only interpolated value is the cookie name.
 * Keep it in step with ThemeProvider's resolution; theme-provider.test.tsx pins the two together.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=([^;]*)/);var v=m?m[1]:'';if(v!=='light'&&v!=='dark'){v=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}var c=document.documentElement.classList;c.remove('light','dark');c.add(v);}catch(e){}})();`;
```

Modify `packages/ui/core/src/providers/index.ts` to read:

```ts
export * from './dark-mode-provider';
export * from './theme-init-script';
export * from './theme-provider';
export * from './text-scale-provider';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run packages/ui/core/src/providers/theme-init-script.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/core/src/providers/theme-init-script.ts packages/ui/core/src/providers/theme-init-script.test.ts packages/ui/core/src/providers/index.ts
git commit -m "feat: add the pre-paint theme mode script and cookie constant"
```

---

### Task 2: ThemeProvider uses the shared cookie name

**Files:**

- Modify: `packages/ui/core/src/providers/theme-provider.tsx:51-55` (the `setMode` cookie write)
- Create: `packages/ui/core/src/providers/theme-provider.test.tsx`

**Interfaces:**

- Consumes: `THEME_COOKIE`, `THEME_INIT_SCRIPT` from `./theme-init-script`.
- Produces: unchanged `ThemeProvider`, `useThemeMode` (`{ mode, system, resolvedMode, setMode }`); the cookie it writes is now `theme`.

- [ ] **Step 1: Write the failing test**

Create `packages/ui/core/src/providers/theme-provider.test.tsx`:

```tsx
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_COOKIE, THEME_INIT_SCRIPT } from './theme-init-script';
import { ThemeProvider, useThemeMode, type ThemeDarkMode } from './theme-provider';

function Probe() {
  const { mode, resolvedMode, setMode } = useThemeMode();
  return (
    <>
      <output data-testid="mode">{mode}</output>
      <output data-testid="resolved">{String(resolvedMode)}</output>
      <button onClick={() => setMode('dark')}>dark</button>
      <button onClick={() => setMode('light')}>light</button>
      <button onClick={() => setMode('system')}>system</button>
      <button onClick={() => setMode('sepia' as ThemeDarkMode)}>invalid</button>
    </>
  );
}

/** A controllable stand-in for the device's colour-scheme preference. */
function stubSystem(initialDark: boolean) {
  let dark = initialDark;
  const listeners = new Set<() => void>();
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      get matches() {
        return dark;
      },
      addEventListener: (_type: string, listener: () => void) =>
        listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) =>
        listeners.delete(listener),
    })),
  );
  return (next: boolean) => {
    dark = next;
    act(() => listeners.forEach((listener) => listener()));
  };
}

const setup = (initialMode: ThemeDarkMode) =>
  render(
    <ThemeProvider initialMode={initialMode}>
      <Probe />
    </ThemeProvider>,
  );
const rootClass = () => document.documentElement.className;
const resolved = () => screen.getByTestId('resolved').textContent;
const clear = () => {
  document.documentElement.className = '';
  document.cookie = `${THEME_COOKIE}=; Max-Age=0; Path=/`;
  document.cookie = 'appearance=; Max-Age=0; Path=/';
};

beforeEach(clear);
afterEach(() => {
  vi.unstubAllGlobals();
  clear();
});

describe('ThemeProvider', () => {
  it('writes the choice to the theme cookie, not the old appearance cookie', () => {
    stubSystem(false);
    setup('system');

    fireEvent.click(screen.getByText('dark'));

    expect(document.cookie).toContain(`${THEME_COOKIE}=dark`);
    expect(document.cookie).not.toContain('appearance=');
    expect(rootClass()).toBe('dark');
  });

  it('switches both directions and back to system', () => {
    stubSystem(false);
    setup('light');

    fireEvent.click(screen.getByText('dark'));
    expect(resolved()).toBe('dark');
    fireEvent.click(screen.getByText('light'));
    expect(resolved()).toBe('light');
    fireEvent.click(screen.getByText('system'));
    expect(screen.getByTestId('mode')).toHaveTextContent('system');
    expect(resolved()).toBe('light');
  });

  it('ignores a value that is not light, dark or system', () => {
    stubSystem(false);
    setup('light');

    fireEvent.click(screen.getByText('invalid'));

    expect(screen.getByTestId('mode')).toHaveTextContent('light');
    expect(document.cookie).not.toContain(THEME_COOKIE);
  });

  it('follows the device while the mode is system', () => {
    const setSystemDark = stubSystem(false);
    setup('system');
    expect(resolved()).toBe('light');
    expect(rootClass()).toBe('light');

    setSystemDark(true);

    expect(resolved()).toBe('dark');
    expect(rootClass()).toBe('dark');
  });

  it('keeps an explicit mode when the device changes', () => {
    const setSystemDark = stubSystem(false);
    setup('light');

    setSystemDark(true);

    expect(resolved()).toBe('light');
    expect(rootClass()).toBe('light');
  });
});

describe('ThemeProvider and THEME_INIT_SCRIPT agree', () => {
  it.each([
    ['light', false],
    ['light', true],
    ['dark', false],
    ['dark', true],
    ['system', false],
    ['system', true],
  ] as const)('mode %s with system dark=%s', (mode, systemDark) => {
    stubSystem(systemDark);
    document.cookie = `${THEME_COOKIE}=${mode}; Path=/`;
    new Function(THEME_INIT_SCRIPT)();
    const fromScript = rootClass();

    document.documentElement.className = '';
    setup(mode);

    expect(rootClass()).toBe(fromScript);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run packages/ui/core/src/providers/theme-provider.test.tsx`
Expected: FAIL on "writes the choice to the theme cookie" (the cookie is still `appearance`). The other cases may already pass.

- [ ] **Step 3: Write minimal implementation**

In `packages/ui/core/src/providers/theme-provider.tsx`, add the import below the React import block:

```tsx
import { THEME_COOKIE } from './theme-init-script';
```

and replace the cookie write line in `setMode` so it reads:

```tsx
    document.cookie = `${THEME_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run packages/ui/core/src/providers/theme-provider.test.tsx packages/ui/core/src/providers/theme-init-script.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/core/src/providers/theme-provider.tsx packages/ui/core/src/providers/theme-provider.test.tsx
git commit -m "fix: write the mode cookie under the shared theme name"
```

---

### Task 3: Move the dark-mode block onto ThemeProvider

**Files:**

- Modify: `packages/ui/core/src/components/blocks/dark-mode/dark-mode-preference-toggle.tsx` (the `mode` prop and the `aria-label`)
- Modify: `packages/ui/core/src/components/blocks/dark-mode/dark-mode-preference-control.tsx`
- Modify: `packages/ui/core/src/components/blocks/dark-mode/dark-mode.test.tsx`

**Interfaces:**

- Consumes: `useThemeMode`, `ThemeProvider` from `../../../providers/theme-provider`.
- Produces: `DarkModePreferenceToggle` with `mode?: DarkMode | null` (still optional for existing callers); `DarkModePreferenceControl` unchanged in name and props.

- [ ] **Step 1: Write the failing test**

Replace the whole of `packages/ui/core/src/components/blocks/dark-mode/dark-mode.test.tsx` with:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DarkModePreferenceToggle } from './dark-mode-preference-toggle';
import { DarkModePreferenceControl } from './dark-mode-preference-control';
import {
  ThemeProvider,
  useThemeMode,
} from '../../../providers/theme-provider';

function ThemeConsumer() {
  const { mode, resolvedMode, setMode } = useThemeMode();

  return (
    <>
      <output data-testid="preference">{mode}</output>
      <output data-testid="mode">{String(resolvedMode)}</output>
      <DarkModePreferenceToggle
        preference={mode}
        onPreferenceChange={setMode}
        mode={resolvedMode}
      />
    </>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.documentElement.className = '';
  document.cookie = 'theme=; Max-Age=0; Path=/';
});

const stubLightSystem = () =>
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );

describe('DarkModePreferenceToggle', () => {
  it('renders the available preference options and dispatches the selected preference', () => {
    const onPreferenceChange = vi.fn();

    render(
      <DarkModePreferenceToggle
        preference="system"
        onPreferenceChange={onPreferenceChange}
        mode="dark"
        className="custom-theme-toggle"
      />,
    );

    const toggle = screen.getByLabelText('Light mode');
    expect(toggle).toBeInTheDocument();
    expect(toggle.closest('[data-slot]')).toBeTruthy();
    fireEvent.click(toggle);
    expect(onPreferenceChange).toHaveBeenCalledWith('light');
    expect(screen.getByLabelText('Dark mode')).toBeInTheDocument();
    expect(screen.getByLabelText('System mode')).toBeInTheDocument();
  });

  it('names the resolved mode in the group label when preference is system', () => {
    render(
      <DarkModePreferenceToggle
        preference="system"
        onPreferenceChange={vi.fn()}
        mode="dark"
      />,
    );

    expect(
      screen.getByLabelText('Theme preference: system (dark)'),
    ).toBeInTheDocument();
  });

  it('leaves the resolved mode out of the label until it is known', () => {
    render(
      <DarkModePreferenceToggle
        preference="system"
        onPreferenceChange={vi.fn()}
        mode={null}
      />,
    );

    expect(
      screen.getByLabelText('Theme preference: system'),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/null/)).not.toBeInTheDocument();
  });

  it('keeps a consumer-rendered toggle connected to provider state', () => {
    stubLightSystem();

    render(
      <ThemeProvider initialMode="system">
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('preference')).toHaveTextContent('system');
    expect(screen.getByTestId('mode')).toHaveTextContent('light');

    fireEvent.click(screen.getByLabelText('Dark mode'));

    expect(screen.getByTestId('preference')).toHaveTextContent('dark');
    expect(screen.getByTestId('mode')).toHaveTextContent('dark');

    fireEvent.click(screen.getByLabelText('System mode'));

    expect(screen.getByTestId('preference')).toHaveTextContent('system');
    expect(screen.getByTestId('mode')).toHaveTextContent('light');
  });

  it('writes the theme cookie and the document class when the control changes mode', () => {
    stubLightSystem();

    render(
      <ThemeProvider initialMode="system">
        <DarkModePreferenceControl />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByLabelText('Dark mode'));

    expect(document.cookie).toContain('theme=dark');
    expect(document.documentElement).toHaveClass('dark');
  });

  it.each([
    ['Light mode', 'Light'],
    ['Dark mode', 'Dark'],
    ['System mode', 'System: follows your device'],
  ])('%s explains itself in a tooltip on focus', async (name, text) => {
    render(
      <DarkModePreferenceToggle
        preference="system"
        onPreferenceChange={vi.fn()}
        mode="light"
      />,
    );

    fireEvent.focus(screen.getByLabelText(name));

    expect(await screen.findByRole('tooltip')).toHaveTextContent(text);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run packages/ui/core/src/components/blocks/dark-mode/dark-mode.test.tsx`
Expected: FAIL. `mode={null}` is rejected by the type and renders "system (null)"; the control test fails because `DarkModePreferenceControl` still needs `DarkModeProvider` and throws.

- [ ] **Step 3: Write minimal implementation**

In `dark-mode-preference-toggle.tsx`, change the props type and label. Replace the `mode: DarkMode;` line with:

```tsx
  mode?: DarkMode | null;
```

and replace the `aria-label` expression:

```tsx
        aria-label={
          preference === 'system'
            ? mode
              ? `Theme preference: system (${mode})`
              : 'Theme preference: system'
            : undefined
        }
```

Replace the whole of `dark-mode-preference-control.tsx` with:

```tsx
'use client';

import { DarkModePreferenceToggle } from './dark-mode-preference-toggle';
import { useThemeMode } from '../../../providers/theme-provider';

/**
 * Light / dark / system preference, wired to the nearest ThemeProvider.
 * Use DarkModePreferenceToggle directly when the preference lives elsewhere.
 */
export function DarkModePreferenceControl() {
  const { mode, resolvedMode, setMode } = useThemeMode();

  return (
    <DarkModePreferenceToggle
      preference={mode}
      onPreferenceChange={setMode}
      mode={resolvedMode}
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run packages/ui/core/src/components/blocks/dark-mode/dark-mode.test.tsx && pnpm typecheck`
Expected: PASS, and typecheck clean. If typecheck flags the Storybook story for the block, give it a `ThemeProvider` decorator rather than changing the component.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/core/src/components/blocks/dark-mode
git commit -m "refactor: wire the dark-mode block to ThemeProvider"
```

---

### Task 4: Root layout reads the shared name and runs the script

**Files:**

- Modify: `apps/web/app/layout.tsx`
- Create: `apps/web/tests/theme-mode.spec.ts`

**Interfaces:**

- Consumes: `InlineScript`, `THEME_COOKIE`, `THEME_INIT_SCRIPT` from `@synapcity/frontend-ui/core`.

- [ ] **Step 1: Write the failing test**

Create `apps/web/tests/theme-mode.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

// Mode must be right on first paint. Two guarantees are pinned here:
// - the server renders the saved explicit mode into <html> before any script runs;
// - for "system", and as a backstop, an inline script sets the class without the app's
//   JavaScript. The app bundles are blocked below, so only the inline script can set it.

test('the server renders a saved explicit mode into <html>', async ({
  request,
}) => {
  const response = await request.get('/home', {
    headers: { cookie: 'theme=dark' },
  });

  expect(await response.text()).toMatch(/<html[^>]*class="[^"]*\bdark\b/);
});

test('the inline script resolves system mode from the device before the app runs', async ({
  browser,
}) => {
  const context = await browser.newContext({ colorScheme: 'dark' });
  const page = await context.newPage();
  await page.route('**/_next/static/**', (route) => route.abort());

  await page.goto('/home');

  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  await context.close();
});

test('an explicit saved mode beats the device before the app runs', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ colorScheme: 'dark' });
  await context.addCookies([{ name: 'theme', value: 'light', url: baseURL! }]);
  const page = await context.newPage();
  await page.route('**/_next/static/**', (route) => route.abort());

  await page.goto('/home');

  await expect(page.locator('html')).toHaveClass(/\blight\b/);
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
  await context.close();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @synapcity/web exec playwright test tests/theme-mode.spec.ts`
Expected: the "system mode" test FAILS (no script in the document yet, and the app bundles are blocked so nothing else sets the class). Run `pnpm browsers:install` first if Chromium is missing.

- [ ] **Step 3: Write minimal implementation**

In `apps/web/app/layout.tsx`:

1. Add the import:

```tsx
import {
  InlineScript,
  THEME_COOKIE,
  THEME_INIT_SCRIPT,
} from '@synapcity/frontend-ui/core';
```

1. Change the cookie read to use the constant:

```tsx
  const cookieDarkMode = cookieStore.get(THEME_COOKIE)?.value;
```

1. Add `suppressHydrationWarning` to `<html>` and a `<head>` carrying the script, so the opening of the returned tree reads:

```tsx
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        initialModePreference === 'system' ? undefined : initialModePreference,
        geist.variable,
        geistMono.variable,
      )}
    >
      <head>
        <InlineScript html={THEME_INIT_SCRIPT} />
      </head>
      <body className="min-h-dvh flex flex-col bg-background font-ui text-foreground antialiased">
```

(the rest of the body is unchanged).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @synapcity/web exec playwright test tests/theme-mode.spec.ts && pnpm typecheck && pnpm lint`
Expected: PASS. If lint objects to the layout, the cause is the `<head>` block or the import; fix it there and do not add a lint disable.

Manual check (record the result in the pull request): in the running app, set the device to dark and clear cookies, hard-reload `/home` and watch for a light flash; then choose Light in the theme control, reload, and confirm it stays light.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/layout.tsx apps/web/tests/theme-mode.spec.ts
git commit -m "fix: set the theme mode before first paint and read the shared cookie"
```

---

### Task 5: Archive DarkModeProvider

**Files:**

- Create: docs/archive/2026-10-10-dark-mode-provider.md (plain text here: `pnpm docs:check` rejects backticked doc paths that do not exist yet)
- Delete (after archiving): `packages/ui/core/src/providers/dark-mode-provider.tsx`
- Modify: `packages/ui/core/src/providers/index.ts`
- Modify: `packages/ui/core/src/components/base/index.ts` (the `DarkModeProvider` export, near line 159)
- Modify: `packages/ui/core/src/components/blocks/dark-mode/dark-mode-preference-toggle.tsx` (the stale cycle comment)
- Modify: `apps/web/components/root/root-command-palette/root-command-palette.tsx` (the commented-out line)

**Interfaces:**

- Consumes: nothing new. After this task nothing may import `dark-mode-provider`.

- [ ] **Step 1: Prove nothing but the planned files still uses it**

Run: `rg -n "dark-mode-provider|DarkModeProvider|useDarkModePreference|useDarkMode\b|DarkModeContext" apps packages docs -g '!node_modules' -g '!.next' -g '!storybook-static' -g '!docs/superpowers/**'`
Expected: only `providers/dark-mode-provider.tsx` itself, `providers/index.ts`, `components/base/index.ts:159`, and the command-palette comment. If anything else appears, stop and report it; do not delete.

Then confirm the only reader of `data-theme` is not part of the app: `rg -n "synapcity-tokens" apps packages -g '!node_modules' -g '!.next' -g '!storybook-static'`. Expected: no import from app or package source. If the app does import it, stop and report: dropping `data-theme` would then need a decision.

- [ ] **Step 2: Write the archive record**

Create the record with the original source embedded, so it needs no retyping:

```bash
REV=$(git log -1 --format=%h -- packages/ui/core/src/providers/dark-mode-provider.tsx)
{
  cat <<EOF
# Archived: DarkModeProvider

**Original location:** \`packages/ui/core/src/providers/dark-mode-provider.tsx\`.
**Archived at revision:** \`$REV\` (last commit that touched it).
**Archived on:** 2026-10-10.

## Why

Two providers owned the light / dark / system mode. \`ThemeProvider\` is the one \`apps/web\` mounts, tracks both the preference and the resolved mode, and reads the system preference without a hydration mismatch. \`DarkModeProvider\` wrote the \`theme\` cookie but did not apply the class for \`system\`, started its system value as \`light\`, and set \`data-theme\`, which only a standalone brand-asset stylesheet reads. ADR-0016 listed consolidating them as separate work; see \`docs/superpowers/specs/2026-10-10-theme-mode-provider-consolidation-design.md\`.

## Replacement

\`ThemeProvider\` and \`useThemeMode\` in \`packages/ui/core/src/providers/theme-provider.tsx\`. \`useDarkModePreference().preference\` is \`useThemeMode().mode\`; \`useDarkMode()\` is \`useThemeMode().resolvedMode\`, which can be \`null\` before the client reads the device preference.

## The removed file

\`\`\`tsx
EOF
  cat packages/ui/core/src/providers/dark-mode-provider.tsx
  printf '```\n'
} > docs/archive/2026-10-10-dark-mode-provider.md
```

Check the result: `sed -n 1,12p` on that file shows the header with a real revision hash and `tail -3` ends with the closing fence.

- [ ] **Step 3: Remove the provider and every reference**

```bash
git rm packages/ui/core/src/providers/dark-mode-provider.tsx
```

- `providers/index.ts`: delete the `export * from './dark-mode-provider';` line.
- `components/base/index.ts`: delete the `export { DarkModeProvider } from '../../providers/dark-mode-provider';` line.
- `dark-mode-preference-toggle.tsx`: delete the two-line comment above the `toggle-group` import that begins `// Import the sibling module directly` (the cycle no longer exists; keep the imports as they are).
- `root-command-palette.tsx`: delete the line `// const { setPreference } = useDarkModePreference();`.

- [ ] **Step 4: Verify nothing broke**

Run: `rg -n "dark-mode-provider|DarkModeProvider|useDarkModePreference" apps packages -g '!node_modules' -g '!.next' -g '!storybook-static'` — expected: no output.
Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm deps && pnpm deps:boundaries && pnpm docs:check`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add docs/archive/2026-10-10-dark-mode-provider.md packages apps
git commit -m "refactor: archive DarkModeProvider in favor of ThemeProvider"
```

---

### Task 6: Record the decisions and verify the whole repository

**Files:**

- Modify: `docs/architecture/decisions/0016-theme-shape-and-functionality.md` (two paragraphs)

- [ ] **Step 1: Amend ADR-0016**

In "What this does NOT decide", replace the last bullet:

```txt
- The existing duplicate dark-mode providers in `ui-core`; consolidating them is
  separate work.
```

with:

```txt
- Any theme state beyond mode. The duplicate dark-mode providers in `ui-core`
  were consolidated onto `ThemeProvider`; `DarkModeProvider` is archived in
  `docs/archive/2026-10-10-dark-mode-provider.md`.
```

In "Unresolved", replace the "Mode cookie name" bullet with:

```txt
- **Mode cookie name.** Interim: the theme provider, the pre-paint script, and
  the root layout all use `theme` (one constant, `THEME_COOKIE`). The final
  persistence key scheme is still undecided and may rename it.
```

- [ ] **Step 2: Run the full repository gate**

Run: `pnpm browsers:install` (once, if not done), then `pnpm verify`
Expected: every stage passes. Record, for the pull request, exactly which stages ran and their results, any stage that did not run, and any failure that existed before this work (compare against `main` if one appears).

- [ ] **Step 3: Commit**

```bash
git add docs/architecture/decisions/0016-theme-shape-and-functionality.md
git commit -m "docs: record the mode provider consolidation in ADR-0016"
```

- [ ] **Step 4: Report**

State, per `AGENTS.md` §9: what changed and why it landed where it did; that the interim cookie name `theme` and the ADR-0016 edit need the owner's approval under §5; the checks run and their results; checks not run; what stays undecided (store, persistence keys, naming, sub-projects B–E); and the manual FOUC check result from Task 4.

---

## Self-review

- **Spec coverage:** provider contract and cookie → Tasks 1–2; pre-paint script and layout → Tasks 1, 4; migration (port block, remove exports, archive, drop commented line, `data-theme`) → Tasks 3, 5; verification list → Tasks 1–5 tests plus Task 6 `pnpm verify`; approvals and ADR edit → Task 6. The spec's two open items map to steps: the brand-asset stylesheet check is Task 5 Step 1, and the `ui-core` export surface for the script constant is covered by Task 1 (`providers/index.ts`) and exercised by the layout import in Task 4.
- **Placeholders:** none; the only runtime-resolved value is the archive revision hash, produced by a command in Task 5.
- **Type consistency:** `THEME_COOKIE`, `THEME_INIT_SCRIPT`, `useThemeMode`, `ThemeDarkMode`, `mode?: DarkMode | null` are used with the same names in every task.
