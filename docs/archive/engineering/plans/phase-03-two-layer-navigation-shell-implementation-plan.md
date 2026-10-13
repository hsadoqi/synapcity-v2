# Phase 3 implementation plan: two-layer navigation shell

**Status:** Proposed. Task order for the design in [phase-03-two-layer-navigation-shell-brief.md](phase-03-two-layer-navigation-shell-brief.md). Not canonical. Nothing here authorizes implementation until the owner approves this plan and an execution method.

**Owns:** the order of work, exact files, interfaces and test steps for the brief's decided parts only. It does not own decisions (the brief does), phase-level sequence ([mvp-phase-overview.md](mvp-phase-overview.md)), issues, or status. It does not plan the items in "Not in this plan" below.

> **For agentic workers:** use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax. Follow `AGENTS.md`: bound each task with `.agents/task-scope.md` before editing, and report exactly what ran and what did not.

**Goal:** A full-height global sidebar and a space-specific icon sidebar, both pushing the page, with only one open at a time, each closing on an outside click unless locked, inside a shell whose root header, Global panel and content column sit to the right of the global sidebar.

**Architecture:** Two `SidebarProvider`s, one per sidebar, so open states stay scoped. A small shared hook, `useExclusiveSidebars`, owns both open states, the locks and the exclusivity rule, and hands each provider its `open` and `onOpenChange`. The shell restructures from "header over a vertical group" into "global sidebar beside a right-hand column". Content reaches the sidebars through parallel-route slots (`@sidebar` becomes the space sidebar's content; `@globalSidebar` is new), not through the hook.

**Tech Stack:** Next 16.3.6 (App Router), React 19.3.0, Tailwind 4.3.3, Base UI via ui-core, Vitest 5 with jsdom, Playwright 1.63.

**Spec:** [phase-03-two-layer-navigation-shell-brief.md](phase-03-two-layer-navigation-shell-brief.md). Related: [phase-03-keyboard-shortcuts-decision-brief.md](phase-03-keyboard-shortcuts-decision-brief.md) (who owns `⌘/Ctrl+B`) and [phase-03-root-header-palette-and-sidebar-slot-brief.md](phase-03-root-header-palette-and-sidebar-slot-brief.md) (slots, palette, header hide).

## Global Constraints

- Versions are pinned by the repository; do not add or upgrade dependencies.
- Import ui-core through `@synapcity/ui-core/components` and `@synapcity/ui-core/layouts/panel`, as the existing root components do.
- Colors and radii come from theme tokens only. No hardcoded colors, no bracket values, no `!important`, no inline `style` for static values (the two existing commented `overflow: hidden` overrides on resizable panels stay).
- `className` on ui-core components is for layout only.
- Merge classes with `cn()` from `apps/web/lib/utils` where classes are combined; never concatenate strings or write a ternary inside a class string.
- Labels such as "Home", "Spaces", "Documents", "Dashboards" are working labels, not adopted vocabulary. Do not edit `docs/glossary.md`.
- Commit messages are a single `type: short summary` line with no body and no trailers. Types: `chore`, `feat`, `fix`, `docs`, `refactor`, `test`. Never write a GitHub closing keyword next to an issue reference.
- The `web` Vitest project discovers only `components/**/*.test.tsx` and `hooks/**/*.test.{ts,tsx}` under `apps/web`; name every web test file `*.test.tsx`. The `ui-core` project discovers `src/**/*.test.tsx`.
- `useHeaderHeight` reads the first `<header>` on the page and writes its height to `--header-height`. Only the root header is a `<header>`.
- Only one `next dev` server can run per project directory. Stop `pnpm dev` before running `pnpm test:smoke`. Browser gates need Chromium (`pnpm browsers:install` once).
- Version-sensitive APIs: before relying on any Base UI, Next or Playwright behavior not already used in this repository, read the installed version's documentation (AGENTS.md section 7a).

## Decisions this plan builds on (all in the brief)

Push for both sidebars; one open at a time; outside click closes an unlocked sidebar and a lock keeps it open (a trial); one provider per sidebar with a shared hook; the surface split of brief section 3; `/home` itself renders no space sidebar, which appears only on nested routes; the root header hides on `/home` routes for pointer devices and returns on its triggers, and opening the global sidebar (by any means, including the keyboard shortcut) reveals it, because the sidebar's toggle lives on the header.

## Not in this plan

- The key that returns the hidden header (plan Task 7 of the earlier header plan, still the owner's choice). Header auto-hide itself is Task 6 below; every other reveal trigger works without the key.
- Persistence of sidebar state. Storage (cookie or `localStorage`) is the owner's choice. This plan turns the unused cookie write off (`cookieName={null}`) and keeps state in memory.
- Space icon selection, creation defaults, a palette action for the space sidebar, and which sidebar finally owns `⌘/Ctrl+B`. This plan keeps `b` on the global sidebar only and disables it on the space sidebar, provisionally.
- Mobile navigation for the space sidebar. On mobile this plan renders only the global sidebar as a sheet; the space sidebar is not rendered. How mobile reaches space content is an open product question.
- Reconciling the Home sidebar IA brief.

## Review Focus

Failure modes the brief implies but a happy-path test would miss, most likely first. Each has a test in the task that owns the code.

1. Two providers must not share behavior: `⌘/Ctrl+B` toggles exactly one sidebar, and neither provider writes the `sidebar_state` cookie (Task 1, Task 4).
2. Opening a sidebar closes the other even if the other is locked, and closing a sidebar releases its lock (Task 2).
3. A click inside the command palette dialog, or on a palette trigger, must not close a sidebar (Task 4, selectors).
4. Closing a sidebar that has keyboard focus returns focus to that sidebar's own toggle, not the other's (Task 4).
5. On mobile the space sidebar is not rendered and the global sheet still works, with no duplicate landmarks (Task 3, Task 4).
6. A hard reload of a nested route renders both slots, not a 404 (Task 4, Task 5).
7. `/home` renders no space sidebar and no gap for one, nested routes do, and navigating from a nested route with the space sidebar expanded to `/home` leaves no stale outside-click or Escape handler (Task 3, Task 4).
8. Opening the global sidebar by `Ctrl+B` while the header is hidden reveals the header, and the header does not hide again while that sidebar is open (Task 6).
9. A header hidden by `autoHide` stays focusable, so keyboard focus entering it reveals it; it never hides while focus is inside or a menu is open; it is never hidden on touch devices or outside `/home` (Task 6).
10. A hidden header keeps its box, so `--header-height` and the Global panel's toolbar row do not change when it hides (Task 6).

## File structure

| File | Responsibility |
| --- | --- |
| `packages/ui/core/src/components/base/sidebar/sidebar-provider.tsx` (modify) | Optional `cookieName` and `keyboardShortcut` props. |
| `packages/ui/core/src/components/base/sidebar/sidebar.test.tsx` (modify) | Tests for the two props. |
| `apps/web/hooks/use-exclusive-sidebars.ts` (create) | Open and lock state for both sidebars; exclusivity. |
| `apps/web/hooks/use-exclusive-sidebars.test.tsx` (create) | Tests for the hook. |
| `apps/web/components/root/root-sidebar-lock-button.tsx` (create) | The lock control both sidebars share. |
| `apps/web/components/root/root-space-sidebar.tsx` (create) | The icon-collapsing space sidebar. |
| `apps/web/components/root/root-space-sidebar.test.tsx` (create) | Tests for it. |
| `apps/web/app/@globalSidebar/default.tsx` (create) | Neutral global sidebar content. |
| `apps/web/app/layout.tsx` (modify) | Accept and pass the `globalSidebar` slot. |
| `apps/web/components/root/root-global-sidebar.tsx` (modify) | Becomes the full-height global sidebar: lock button, marker, no absolute override. |
| `apps/web/components/root/root-global-content.tsx` (modify) | Lower panel row: space sidebar plus the content column. |
| `apps/web/components/root/root-shell.tsx` (modify) | Two providers, the hook, the two-column frame, dismissal. |
| `apps/web/components/root/root-navigation.tsx` (modify) | Marks the header toggle as the global sidebar's. |
| `apps/web/components/root/root-routes.ts` (modify) | Adds `hasSpaceSidebar` (Task 3) and `isHomeRoute` (Task 6). |
| `apps/web/components/root/root-routes.test.tsx` (create in Task 3, extended in Task 6) | Tests for both. |
| `apps/web/hooks/use-root-header-reveal.ts` (create) | Reveal state for the auto-hiding header. |
| `apps/web/hooks/use-root-header-reveal.test.tsx` (create) | Tests for it. |
| `apps/web/components/root/root-header.tsx` (modify) | Auto-hide structure, the logo handle and the top-edge strip. |
| `apps/web/components/root/root-header.test.tsx` (modify) | Tests for the auto-hide behavior. |
| `apps/web/tests/app-shell.spec.ts` (modify) | Helpers, updated tests, new coverage. |

---

### Task 1: Provider props for cookie name and keyboard shortcut

**Files:**

- Modify: `packages/ui/core/src/components/base/sidebar/sidebar-provider.tsx`
- Modify: `packages/ui/core/src/components/base/sidebar/sidebar.test.tsx`

**Interfaces:**

- Produces: `SidebarProvider` gains `cookieName?: string | null` (default `SIDEBAR_COOKIE_NAME`; `null` writes no cookie) and `keyboardShortcut?: string | null` (default `SIDEBAR_KEYBOARD_SHORTCUT`; `null` registers no listener). Defaults keep today's behavior exactly.

- [ ] **Step 1: Write the failing tests**

In `sidebar.test.tsx`, add inside `describe('Sidebar', ...)`, after the existing test:

```tsx
  describe('provider options', () => {
    const readCookie = (name: string) =>
      document.cookie
        .split('; ')
        .find((entry) => entry.startsWith(`${name}=`));

    const press = (init: KeyboardEventInit) =>
      fireEvent.keyDown(window, { key: 'b', ...init });

    const renderProvider = (
      props: React.ComponentProps<typeof SidebarProvider> = {},
    ) =>
      render(
        <SidebarProvider defaultOpen {...props}>
          <Sidebar collapsible="offcanvas">
            <div>Navigation</div>
          </Sidebar>
          <SidebarTrigger>Toggle Sidebar</SidebarTrigger>
        </SidebarProvider>,
      );

    const state = () =>
      document.querySelector('[data-slot="sidebar"]')?.getAttribute('data-state');

    beforeEach(() => {
      document.cookie = 'sidebar_state=; Max-Age=0; Path=/';
      document.cookie = 'custom_state=; Max-Age=0; Path=/';
    });

    it('writes the default cookie when toggled', () => {
      renderProvider();

      fireEvent.click(screen.getByRole('button', { name: 'Toggle Sidebar' }));

      expect(readCookie('sidebar_state')).toBe('sidebar_state=false');
    });

    it('writes a custom cookie name instead of the default', () => {
      renderProvider({ cookieName: 'custom_state' });

      fireEvent.click(screen.getByRole('button', { name: 'Toggle Sidebar' }));

      expect(readCookie('custom_state')).toBe('custom_state=false');
      expect(readCookie('sidebar_state')).toBeUndefined();
    });

    it('writes no cookie when cookieName is null', () => {
      renderProvider({ cookieName: null });

      fireEvent.click(screen.getByRole('button', { name: 'Toggle Sidebar' }));

      expect(readCookie('sidebar_state')).toBeUndefined();
      expect(state()).toBe('collapsed');
    });

    it('toggles on Ctrl+B by default', () => {
      renderProvider();

      press({ ctrlKey: true });

      expect(state()).toBe('collapsed');
    });

    it('uses a custom shortcut key', () => {
      renderProvider({ keyboardShortcut: 'j' });

      press({ ctrlKey: true });
      expect(state()).toBe('expanded');

      fireEvent.keyDown(window, { key: 'j', ctrlKey: true });
      expect(state()).toBe('collapsed');
    });

    it('ignores the shortcut when keyboardShortcut is null', () => {
      renderProvider({ keyboardShortcut: null });

      press({ ctrlKey: true });
      press({ metaKey: true });

      expect(state()).toBe('expanded');
    });
  });
```

Add `import type * as React from 'react';` at the top if the file does not already import React types.

- [ ] **Step 2: Run and confirm it fails**

Run: `pnpm exec vitest run --project ui-core src/components/base/sidebar/sidebar.test.tsx`
Expected: FAIL. The custom-cookie, null-cookie, custom-shortcut and null-shortcut tests fail (the props are ignored).

- [ ] **Step 3: Implement the props**

In `sidebar-provider.tsx`, extend the signature and the prop type:

```tsx
export const SidebarProvider = ({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  cookieName = SIDEBAR_COOKIE_NAME,
  keyboardShortcut = SIDEBAR_KEYBOARD_SHORTCUT,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (_open: boolean) => void;
  /** Cookie that remembers the open state. `null` writes no cookie. */
  cookieName?: string | null;
  /** Key that toggles the sidebar with Cmd or Ctrl. `null` registers no shortcut. */
  keyboardShortcut?: string | null;
}) => {
```

Replace the cookie write inside `setOpen`:

```tsx
      if (cookieName) {
        document.cookie = `${cookieName}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      }
```

and add `cookieName` to that callback's dependency array (`[setOpenProp, open, cookieName]`).

Replace the shortcut effect:

```tsx
  React.useEffect(() => {
    if (keyboardShortcut === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === keyboardShortcut && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, keyboardShortcut]);
```

- [ ] **Step 4: Run and confirm it passes**

Run: `pnpm exec vitest run --project ui-core src/components/base/sidebar`
Expected: PASS.

- [ ] **Step 5: Verify and commit**

```bash
pnpm --filter @synapcity/ui-core typecheck
pnpm exec eslint packages/ui/core/src/components/base/sidebar
git add packages/ui/core/src/components/base/sidebar
git commit -m "feat: let the sidebar provider turn off its cookie and shortcut"
```

---

### Task 2: The exclusive sidebars hook

**Files:**

- Create: `apps/web/hooks/use-exclusive-sidebars.ts`
- Create: `apps/web/hooks/use-exclusive-sidebars.test.tsx`

**Interfaces:**

- Produces: `type SidebarId = 'global' | 'space'` and `useExclusiveSidebars()` returning `{ isOpen(id): boolean; isLocked(id): boolean; setOpen(id, open): void; toggle(id): void; toggleLock(id): void; dismissibleId: SidebarId | null }`.
- Rules: opening one closes the other and releases the other's lock (an explicit open wins over a lock); closing releases that sidebar's lock; `toggleLock` does nothing while closed; `dismissibleId` is the open, unlocked sidebar, or `null`. "Open" means expanded for the space sidebar and visible for the global sidebar.

- [ ] **Step 1: Write the failing tests**

Create `apps/web/hooks/use-exclusive-sidebars.test.tsx`:

```tsx
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useExclusiveSidebars } from './use-exclusive-sidebars';

const setup = () => renderHook(() => useExclusiveSidebars());

describe('useExclusiveSidebars', () => {
  it('starts with both sidebars closed and unlocked', () => {
    const { result } = setup();

    expect(result.current.isOpen('global')).toBe(false);
    expect(result.current.isOpen('space')).toBe(false);
    expect(result.current.isLocked('global')).toBe(false);
    expect(result.current.dismissibleId).toBeNull();
  });

  it('closes the space sidebar when the global one opens', () => {
    const { result } = setup();
    act(() => result.current.setOpen('space', true));

    act(() => result.current.setOpen('global', true));

    expect(result.current.isOpen('global')).toBe(true);
    expect(result.current.isOpen('space')).toBe(false);
  });

  it('closes the global sidebar when the space one opens', () => {
    const { result } = setup();
    act(() => result.current.setOpen('global', true));

    act(() => result.current.setOpen('space', true));

    expect(result.current.isOpen('space')).toBe(true);
    expect(result.current.isOpen('global')).toBe(false);
  });

  it('closes the other sidebar even when it is locked, and releases its lock', () => {
    const { result } = setup();
    act(() => result.current.setOpen('global', true));
    act(() => result.current.toggleLock('global'));

    act(() => result.current.setOpen('space', true));

    expect(result.current.isOpen('global')).toBe(false);
    expect(result.current.isLocked('global')).toBe(false);
  });

  it('keeps the lock while open and releases it on close', () => {
    const { result } = setup();
    act(() => result.current.setOpen('global', true));
    act(() => result.current.toggleLock('global'));
    expect(result.current.isLocked('global')).toBe(true);

    act(() => result.current.setOpen('global', false));

    expect(result.current.isLocked('global')).toBe(false);
  });

  it('ignores a lock request while the sidebar is closed', () => {
    const { result } = setup();

    act(() => result.current.toggleLock('space'));

    expect(result.current.isLocked('space')).toBe(false);
  });

  it('reports the open, unlocked sidebar as dismissible, and none when locked', () => {
    const { result } = setup();
    act(() => result.current.setOpen('space', true));
    expect(result.current.dismissibleId).toBe('space');

    act(() => result.current.toggleLock('space'));

    expect(result.current.dismissibleId).toBeNull();
  });

  it('toggles open and closed', () => {
    const { result } = setup();

    act(() => result.current.toggle('global'));
    expect(result.current.isOpen('global')).toBe(true);

    act(() => result.current.toggle('global'));
    expect(result.current.isOpen('global')).toBe(false);
  });

  it('keeps the same state object when nothing changes', () => {
    const { result } = setup();
    const before = result.current.dismissibleId;

    act(() => result.current.setOpen('global', false));

    expect(result.current.dismissibleId).toBe(before);
  });
});
```

- [ ] **Step 2: Run and confirm it fails**

Run: `pnpm exec vitest run --project web hooks/use-exclusive-sidebars.test.tsx`
Expected: FAIL ("Failed to resolve import ./use-exclusive-sidebars").

- [ ] **Step 3: Implement the hook**

Create `apps/web/hooks/use-exclusive-sidebars.ts`:

```ts
import * as React from 'react';

export type SidebarId = 'global' | 'space';

const OTHER: Record<SidebarId, SidebarId> = {
  global: 'space',
  space: 'global',
};

const IDS: readonly SidebarId[] = ['global', 'space'];

interface State {
  open: Record<SidebarId, boolean>;
  locked: Record<SidebarId, boolean>;
}

const INITIAL: State = {
  open: { global: false, space: false },
  locked: { global: false, space: false },
};

/**
 * Open and lock state for the two sidebars, with one rule: only one is open at a time.
 * Opening a sidebar closes the other and releases that one's lock, because an explicit
 * open wins over a lock. A lock only blocks dismissal (outside click, Escape); closing
 * a sidebar releases its own lock, the same as the Global panel.
 *
 * It owns state only. Each sidebar's provider receives `open` and `onOpenChange`, and
 * content reaches the sidebars through slots, not through this hook. It does not persist
 * anything: where state is stored is an open owner decision.
 */
export function useExclusiveSidebars() {
  const [state, setState] = React.useState<State>(INITIAL);

  const setOpen = React.useCallback((id: SidebarId, open: boolean) => {
    setState((current) => {
      if (current.open[id] === open) return current;
      const next: State = {
        open: { ...current.open },
        locked: { ...current.locked },
      };
      next.open[id] = open;
      if (open) {
        next.open[OTHER[id]] = false;
        next.locked[OTHER[id]] = false;
      } else {
        next.locked[id] = false;
      }
      return next;
    });
  }, []);

  const toggle = React.useCallback(
    (id: SidebarId) => setOpen(id, !state.open[id]),
    [setOpen, state.open],
  );

  const toggleLock = React.useCallback((id: SidebarId) => {
    setState((current) => {
      if (!current.open[id]) return current;
      return {
        ...current,
        locked: { ...current.locked, [id]: !current.locked[id] },
      };
    });
  }, []);

  const dismissibleId =
    IDS.find((id) => state.open[id] && !state.locked[id]) ?? null;

  return {
    isOpen: (id: SidebarId) => state.open[id],
    isLocked: (id: SidebarId) => state.locked[id],
    setOpen,
    toggle,
    toggleLock,
    dismissibleId,
  };
}
```

- [ ] **Step 4: Run and confirm it passes**

Run: `pnpm exec vitest run --project web hooks/use-exclusive-sidebars.test.tsx`
Expected: PASS (9 tests).

- [ ] **Step 5: Verify and commit**

```bash
pnpm --filter @synapcity/web typecheck
pnpm exec eslint apps/web/hooks
git add apps/web/hooks
git commit -m "feat: add a hook that keeps only one sidebar open"
```

---

### Task 3: The space sidebar, the shared lock button and the global slot

**Files:**

- Create: `apps/web/components/root/root-sidebar-lock-button.tsx`
- Create: `apps/web/components/root/root-space-sidebar.tsx`
- Create: `apps/web/components/root/root-space-sidebar.test.tsx`
- Modify: `apps/web/components/root/root-routes.ts` and create `apps/web/components/root/root-routes.test.tsx`
- Create: `apps/web/app/@globalSidebar/default.tsx`

**Interfaces:**

- Consumes: `currentRouteItem(pathname)` from `./root-routes`; `useSidebar()` from ui-core.
- Produces: `hasSpaceSidebar(pathname: string): boolean`, true for nested routes under `/home` and false for `/home` itself (and for anything outside `/home`); `RootSidebarLockButton({ name, locked, onToggle })`; `RootSpaceSidebar({ children, locked, onToggleLock })` rendering `null` on mobile and where `hasSpaceSidebar` is false; the space sidebar's container carries `data-sidebar-id="space"` and its toggle carries `data-sidebar-toggle="space"`.

- [ ] **Step 1: Write the failing route tests, then the predicate**

Create `apps/web/components/root/root-routes.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { hasSpaceSidebar } from './root-routes';

describe('hasSpaceSidebar', () => {
  it('is false on /home itself, with or without a trailing slash', () => {
    expect(hasSpaceSidebar('/home')).toBe(false);
    expect(hasSpaceSidebar('/home/')).toBe(false);
  });

  it('is true on nested routes under /home', () => {
    expect(hasSpaceSidebar('/home/spaces')).toBe(true);
    expect(hasSpaceSidebar('/home/spaces/abc')).toBe(true);
    expect(hasSpaceSidebar('/home/documents')).toBe(true);
    expect(hasSpaceSidebar('/home/dashboards')).toBe(true);
  });

  it('is false outside /home, including look-alikes', () => {
    expect(hasSpaceSidebar('/')).toBe(false);
    expect(hasSpaceSidebar('/homepage')).toBe(false);
    expect(hasSpaceSidebar('/other/home/spaces')).toBe(false);
  });
});
```

Run: `pnpm exec vitest run --project web components/root/root-routes.test.tsx`
Expected: FAIL (`hasSpaceSidebar` is not exported).

Append to `root-routes.ts`:

```ts
/**
 * True on nested routes under /home. /home itself has no space sidebar: it is the
 * homepage, where creating a Document, Dashboard or Space happens on the page, so there
 * is no space to show a sidebar for. `/homepage` is deliberately not a /home route.
 */
export function hasSpaceSidebar(pathname: string): boolean {
  return pathname.startsWith('/home/') && pathname.replace(/\/+$/, '') !== '/home';
}
```

Re-run. Expected: PASS.

- [ ] **Step 2: Write the failing sidebar tests**

Create `apps/web/components/root/root-space-sidebar.test.tsx`:

```tsx
import {
  DarkModeProvider,
  SidebarProvider,
} from '@synapcity/ui-core/components';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RootSpaceSidebar } from './root-space-sidebar';

const nav = vi.hoisted(() => ({ pathname: '/home/spaces/abc' }));
vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: vi.fn() }),
}));

const ORIGINAL_WIDTH = window.innerWidth;

// useIsMobile reads window.innerWidth (not the media query's result), so tests set that.
const setViewportWidth = (width: number) =>
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
  });

beforeEach(() => {
  nav.pathname = '/home/spaces/abc';
  setViewportWidth(1280);
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});

afterEach(() => setViewportWidth(ORIGINAL_WIDTH));

function renderSidebar(
  props: { defaultOpen?: boolean; locked?: boolean } = {},
) {
  const onToggleLock = vi.fn();
  render(
    <DarkModeProvider initialModePreference="system">
      <SidebarProvider defaultOpen={props.defaultOpen ?? true}>
        <RootSpaceSidebar
          locked={props.locked ?? false}
          onToggleLock={onToggleLock}
        >
          <p>Space content</p>
        </RootSpaceSidebar>
      </SidebarProvider>
    </DarkModeProvider>,
  );
  return { onToggleLock };
}

// The first test in a file pays a one-time import cost under jsdom, past the 5 s default.
describe('RootSpaceSidebar', { timeout: 15_000 }, () => {
  it('renders the slot content', () => {
    renderSidebar();

    expect(screen.getByText('Space content')).toBeInTheDocument();
  });

  it('marks its container and its toggle so the shell can find them', () => {
    renderSidebar();

    expect(document.querySelector('[data-sidebar-id="space"]')).not.toBeNull();
    expect(
      screen.getByRole('button', { name: 'Collapse space sidebar' }),
    ).toHaveAttribute('data-sidebar-toggle', 'space');
  });

  it('names the toggle by what it will do, and reports its state', () => {
    renderSidebar({ defaultOpen: true });
    const toggle = screen.getByRole('button', {
      name: 'Collapse space sidebar',
    });

    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(toggle);

    expect(
      screen.getByRole('button', { name: 'Expand space sidebar' }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows the current location on the toggle', () => {
    renderSidebar();

    expect(
      screen.getByRole('button', { name: 'Collapse space sidebar' }),
    ).toHaveTextContent('Spaces');
  });

  it('puts a lock button in the expanded sidebar', () => {
    const { onToggleLock } = renderSidebar({ defaultOpen: true });

    fireEvent.click(
      screen.getByRole('button', { name: 'Lock space sidebar open' }),
    );

    expect(onToggleLock).toHaveBeenCalledTimes(1);
  });

  it('reflects a locked state on the lock button', () => {
    renderSidebar({ defaultOpen: true, locked: true });

    expect(
      screen.getByRole('button', { name: 'Unlock space sidebar' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders nothing on /home itself, which has no space sidebar', () => {
    nav.pathname = '/home';
    const { container } = render(
      <DarkModeProvider initialModePreference="system">
        <SidebarProvider>
          <RootSpaceSidebar locked={false} onToggleLock={vi.fn()}>
            <p>Space content</p>
          </RootSpaceSidebar>
        </SidebarProvider>
      </DarkModeProvider>,
    );

    expect(container.querySelector('[data-sidebar-id="space"]')).toBeNull();
  });

  it('renders nothing on mobile, where only the global sidebar exists', () => {
    setViewportWidth(500);
    const { container } = render(
      <DarkModeProvider initialModePreference="system">
        <SidebarProvider>
          <RootSpaceSidebar locked={false} onToggleLock={vi.fn()}>
            <p>Space content</p>
          </RootSpaceSidebar>
        </SidebarProvider>
      </DarkModeProvider>,
    );

    expect(container.querySelector('[data-sidebar-id="space"]')).toBeNull();
  });
});
```

(`useIsMobile` in `packages/ui/core/src/hooks/use-mobile.ts` decides from `window.innerWidth` against a 768px breakpoint, which is why the mobile test sets the width. It runs in an effect, so `render` returns after the first pass has already updated `isMobile`.)

- [ ] **Step 3: Run and confirm it fails**

Run: `pnpm exec vitest run --project web components/root/root-space-sidebar.test.tsx`
Expected: FAIL ("Failed to resolve import ./root-space-sidebar").

- [ ] **Step 4: Create the lock button**

Create `apps/web/components/root/root-sidebar-lock-button.tsx`:

```tsx
'use client';

import { IconButton } from '@synapcity/ui-core/components';
import { Lock, LockOpen } from 'lucide-react';

/**
 * The lock both sidebars share, mirroring the Global panel's lock: a locked sidebar
 * ignores outside clicks and Escape, but can still be toggled. Closing releases it.
 */
export function RootSidebarLockButton({
  name,
  locked,
  onToggle,
}: {
  /** "global" or "space": names the control for assistive technology. */
  name: string;
  locked: boolean;
  onToggle: () => void;
}) {
  return (
    <IconButton
      variant="ghost"
      size="md"
      label={locked ? `Unlock ${name} sidebar` : `Lock ${name} sidebar open`}
      icon={LockOpen}
      pressedIcon={Lock}
      pressed={locked}
      tooltip={
        locked
          ? 'Unlock to allow outside clicks and Escape to close it.'
          : 'Lock it open. Otherwise an outside click or Escape closes it.'
      }
      onClick={onToggle}
    />
  );
}
```

- [ ] **Step 5: Create the space sidebar**

Create `apps/web/components/root/root-space-sidebar.tsx`:

```tsx
'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import {
  Icon,
  ScrollArea,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@synapcity/ui-core/components';
import { GalleryVerticalEnd } from 'lucide-react';
import { RootSidebarLockButton } from './root-sidebar-lock-button';
import { currentRouteItem, hasSpaceSidebar } from './root-routes';

/**
 * The space-specific sidebar. It collapses to an icon rail instead of hiding, so the
 * user can always see which space they are in: the toggle's icon and label come from
 * the current location, with a tooltip on hover. "Open" means expanded; the rail is its
 * closed state. Content arrives through the `@sidebar` slot.
 *
 * The tile icon is a placeholder: users will choose their own icons per space. It
 * renders nothing on `/home` itself (the homepage has no space to show a sidebar for; see
 * `hasSpaceSidebar`) and nothing on mobile, where only the global sidebar exists for now.
 */
export function RootSpaceSidebar({
  children,
  locked,
  onToggleLock,
}: {
  children?: ReactNode;
  locked: boolean;
  onToggleLock: () => void;
}) {
  const { open, isMobile, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  if (isMobile || !hasSpaceSidebar(pathname)) return null;

  const { label } = currentRouteItem(pathname);
  return (
    <Sidebar
      collapsible="icon"
      data-sidebar-id="space"
      // Positioned inside the lower panel's row, not fixed to the viewport.
      className="absolute top-0 h-full"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              data-sidebar-toggle="space"
              aria-label={`${open ? 'Collapse' : 'Expand'} space sidebar`}
              aria-expanded={open}
              // Hidden by default unless the sidebar is collapsed; the label is visible
              // when expanded, so this only matters on the rail, but it must show there.
              tooltip={{ children: label, hidden: false }}
              onClick={toggleSidebar}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Icon icon={GalleryVerticalEnd} />
              </div>
              <span className="truncate font-medium">{label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-hidden">
        <ScrollArea className="min-h-0 flex-1">{children}</ScrollArea>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <RootSidebarLockButton
          name="space"
          locked={locked}
          onToggle={onToggleLock}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
```

- [ ] **Step 6: Create the global slot default**

The space sidebar's `@sidebar/default.tsx` is already the neutral placeholder and does not change: `/home` has no space sidebar, so no Home-specific entries are defined, and nested routes supply their own content later through `@sidebar/...` pages.

Create `apps/web/app/@globalSidebar/default.tsx`:

```tsx
/**
 * The neutral global sidebar content, shown for every route until the global layer
 * supplies its own `@globalSidebar/...` page. It will list the spaces and global
 * actions. `default.tsx` is required for the same reason as `@sidebar/default.tsx`.
 */
export default function GlobalSidebarDefault() {
  return <div data-placeholder-region="global-sidebar" className="min-h-full" />;
}
```

- [ ] **Step 7: Run and confirm it passes**

Run: `pnpm exec vitest run --project web components/root/root-space-sidebar.test.tsx`
Expected: PASS (8 tests). If the mobile case fails, check that the width was set before `render` and that nothing restored it; fix the test, not the component.

- [ ] **Step 8: Verify and commit**

```bash
pnpm --filter @synapcity/web typecheck
pnpm exec eslint apps/web/components/root apps/web/app
git add apps/web/components/root apps/web/app/@globalSidebar
git commit -m "feat: add the icon-collapsing space sidebar and its slot content"
```

---

### Task 4: The two-column frame, the providers and the dismissal rules

**Files:**

- Modify: `apps/web/components/root/root-global-sidebar.tsx`
- Modify: `apps/web/components/root/root-global-content.tsx`
- Modify: `apps/web/components/root/root-global-content.test.tsx`
- Modify: `apps/web/components/root/root-shell.tsx`
- Modify: `apps/web/components/root/root-navigation.tsx`
- Modify: `apps/web/app/layout.tsx`

**Interfaces:**

- Consumes: `useExclusiveSidebars`, `SidebarId` (Task 2); `RootSpaceSidebar`, `RootSidebarLockButton` (Task 3); the provider props (Task 1).
- Produces: `RootShell({ children, sidebar, globalSidebar, header })`; `RootGlobalSidebar({ children, locked?, onToggleLock?, ...sidebarProps })` carrying `data-sidebar-id="global"`; `RootGlobalContent({ children, sidebar, header, spaceLocked, onToggleSpaceLock })`.
- Markers the shell relies on: `data-sidebar-id="global" | "space"` on each sidebar container; `data-sidebar-toggle="global" | "space"` on each toggle.

- [ ] **Step 1: Update the content-column test (failing first)**

In `root-global-content.test.tsx`, first change the mocked pathname from `'/home'` to `'/home/spaces/abc'`: the space sidebar renders only on nested routes, so the existing mock would hide it. Then change `renderContent` to pass the new props and add the cases below:

```tsx
function renderContent(header?: React.ReactNode) {
  return render(
    <DarkModeProvider initialModePreference="system">
      <SidebarProvider defaultOpen>
        <RootGlobalContent
          sidebar={<p>Sidebar slot</p>}
          header={header}
          spaceLocked={false}
          onToggleSpaceLock={() => {}}
        >
          <p>Page content</p>
        </RootGlobalContent>
      </SidebarProvider>
    </DarkModeProvider>,
  );
}
```

```tsx
  it('renders the space sidebar beside the content column, with the slot inside it', () => {
    renderContent(<p>Header slot</p>);

    const rail = document.querySelector('[data-sidebar-id="space"]');
    expect(rail).not.toBeNull();
    expect(rail).toContainElement(screen.getByText('Sidebar slot'));
    expect(rail).not.toContainElement(screen.getByText('Header slot'));
  });

  it('renders no space sidebar on /home itself', () => {
    // Re-mock the pathname for this case with vi.hoisted, as in root-space-sidebar.test.tsx.
    nav.pathname = '/home';
    renderContent(<p>Header slot</p>);

    expect(document.querySelector('[data-sidebar-id="space"]')).toBeNull();
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('keeps the header outside the space sidebar, so the sidebar keeps its full height', () => {
    renderContent(<p>Header slot</p>);

    expect(
      document.querySelector('[data-sidebar-id="space"]'),
    ).not.toContainElement(screen.getByText('Header slot'));
  });
```

Run: `pnpm exec vitest run --project web components/root/root-global-content.test.tsx`
Expected: FAIL (`spaceLocked` is not a prop; the space sidebar does not exist in this component yet).

- [ ] **Step 2: Update `root-global-content.tsx`**

Replace the file:

```tsx
'use client';

import type { ReactNode } from 'react';
import { ContentContainer } from '@synapcity/ui-core/components';
import { RootSpaceSidebar } from './root-space-sidebar';

/**
 * The lower panel's row: the space sidebar beside a content column. The column holds the
 * `@header` slot above the page, so the header sits directly under the Global panel and
 * beside the sidebar, which keeps its full height. The header is outside <main>, so the
 * skip link lands on the page, and outside the scroll area, so it never scrolls away.
 * It renders inside the space sidebar's provider (see RootShell).
 */
export function RootGlobalContent({
  children,
  sidebar,
  header,
  spaceLocked,
  onToggleSpaceLock,
}: {
  children: ReactNode;
  sidebar?: ReactNode;
  header?: ReactNode;
  spaceLocked: boolean;
  onToggleSpaceLock: () => void;
}) {
  return (
    <div className="relative flex h-full min-h-0 w-full">
      <RootSpaceSidebar locked={spaceLocked} onToggleLock={onToggleSpaceLock}>
        {sidebar}
      </RootSpaceSidebar>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {header}
        <main
          id="root-main-content"
          tabIndex={-1}
          className="flex min-h-0 min-w-0 flex-1 flex-col"
        >
          <ContentContainer>{children}</ContentContainer>
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update `root-global-sidebar.tsx`**

Make the sidebar the full-height global one. Change the props and the returned element:

```tsx
export function RootGlobalSidebar({
  children,
  locked = false,
  onToggleLock,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  locked?: boolean;
  onToggleLock?: () => void;
}) {
  const { open, isMobile } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const current = currentRouteItem(pathname);
  return (
    <Sidebar
      data-sidebar-id="global"
      {...props}
      // The desktop offcanvas region is still mounted while hidden. The mobile
      // Sheet owns its own visibility and focus management.
      inert={props.inert || (!isMobile && !open)}
    >
```

Remove the `className="absolute top-0 h-full"` line (the global sidebar is fixed to the full viewport height, which is what the new frame wants), keep the header, `SidebarContent` and slot as they are, and change the footer to:

```tsx
      <SidebarFooter>
        {onToggleLock && (
          <RootSidebarLockButton
            name="global"
            locked={locked}
            onToggle={onToggleLock}
          />
        )}
        <DarkModePreferenceControl />
      </SidebarFooter>
```

Add `import { RootSidebarLockButton } from './root-sidebar-lock-button';`. Update the component's doc comment: it is now the global sidebar, and its `children` come from the `@globalSidebar` slot.

- [ ] **Step 4: Mark the header toggle**

In `root-navigation.tsx`, change the wordmark button's marker:

```tsx
          data-sidebar-toggle="global"
```

(it was `data-sidebar-toggle=""`). The header test that asserts `toHaveAttribute('data-sidebar-toggle')` still passes.

- [ ] **Step 5: Replace `root-shell.tsx`**

Replace the file. This is the largest change; read it against the current file first.

```tsx
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { SidebarProvider, useSidebar } from '@synapcity/ui-core';
import { RootHeader } from './root-header';
import { RootCommandPaletteProvider } from './root-command-palette';
import { RootGlobalPanel } from './root-global-panel';
import { useCollapsiblePanel } from '@synapcity/ui-core/hooks/use-collapsible-panel';
import { useEscapeKey } from '@synapcity/ui-core/hooks/use-escape-key';
import { useHeaderHeight } from '@synapcity/ui-core/hooks/use-header-height';
import { useOutsideClick } from '@synapcity/ui-core/hooks/use-outside-click';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@synapcity/ui-core';
import { RootGlobalContent } from './root-global-content';
import { RootGlobalSidebar } from './root-global-sidebar';
import { hasSpaceSidebar } from './root-routes';
import {
  useExclusiveSidebars,
  type SidebarId,
} from '../../hooks/use-exclusive-sidebars';

const GLOBAL_PANEL_ID = 'global-panel';
const GLOBAL_PANEL_DEFAULT_OPEN_PERCENT = 30;

// A press on any of these counts as "inside" for the global panel's outside-click handler.
//
// Dismissal rules:
// - Clicking a sidebar toggle closes an unlocked global panel (it is "outside" the global
//   panel); a locked global panel ignores every outside click.
// - Clicking the global-panel toggle never closes a sidebar.
// - The command palette never dismisses the panel: its two header triggers, its dialog
//   and the dialog's backdrop all count as inside. (Escape still closes the palette first.)
// - The list includes the resize handle, so dragging it never dismisses the panel,
//   and open menus, which render in a portal outside the panel's DOM.
const GLOBAL_PANEL_INSIDE = [
  '[data-root-global-panel]',
  '[data-panel-toggle]',
  '[data-command-palette-trigger]',
  '[data-separator]',
  '[role="menu"]',
  '[data-slot="dialog-content"]',
  '[data-slot="dialog-overlay"]',
] as const;

// A press on any of these counts as "inside" for the sidebars' outside-click handler.
//
// Dismissal rules (a trial, see the two-layer shell brief):
// - An outside click closes an unlocked sidebar; a lock keeps it open. Both sidebars push
//   the page, so each such click reflows the content.
// - Either sidebar's own toggle, the global-panel toggle, the palette's triggers and its
//   dialog, the resize handle and open menus all count as inside. A click inside either
//   sidebar counts as inside both; only one is ever open, so this never keeps the other
//   open.
const SIDEBAR_INSIDE = [
  '[data-sidebar-id]',
  '[data-sidebar-toggle]',
  '[data-panel-toggle]',
  '[data-command-palette-trigger]',
  '[data-separator]',
  '[role="menu"]',
  '[data-slot="dialog-content"]',
  '[data-slot="dialog-overlay"]',
] as const;

/**
 * App shell. The page itself never scrolls; each region owns its scrolling:
 *
 *   global SidebarProvider (h-dvh, overflow-hidden, a row)
 *   ├─ RootGlobalSidebar          (full height, offcanvas, pushes the right column)
 *   └─ right column
 *      ├─ RootHeader
 *      └─ vertical group
 *         ├─ global panel         → ScrollArea (collapsible, starts collapsed)
 *         └─ lower panel
 *            └─ space SidebarProvider (a row)
 *               ├─ RootSpaceSidebar   (icon rail, pushes the content column)
 *               └─ content column: header slot, then main → ScrollArea → {children}
 *
 * Each sidebar has its own provider so their open states stay scoped; the
 * useExclusiveSidebars hook owns both states and keeps only one open. Scrolling only
 * works while every flex ancestor between the shell and a ScrollArea has a bounded
 * height, which is what the `min-h-0` classes keep true.
 */

function restoreFocusFromSidebar(shell: HTMLElement | null, id: SidebarId) {
  const container = shell?.querySelector(`[data-sidebar-id="${id}"]`);
  // Return keyboard focus to this sidebar's own toggle before the closed sidebar
  // becomes inert (global) or collapses to its rail (space).
  if (container?.contains(document.activeElement)) {
    shell
      ?.querySelector<HTMLElement>(`[data-sidebar-toggle="${id}"]`)
      ?.focus({ preventScroll: true });
  }
}

export const RootShell = ({
  children,
  sidebar,
  globalSidebar,
  header,
}: {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  globalSidebar?: React.ReactNode;
  header?: React.ReactNode;
}) => {
  const shellRef = React.useRef<HTMLDivElement>(null);
  const sidebars = useExclusiveSidebars();

  const changeOpen = (id: SidebarId, open: boolean) => {
    if (!open) restoreFocusFromSidebar(shellRef.current, id);
    sidebars.setOpen(id, open);
  };

  return (
    <SidebarProvider
      ref={shellRef}
      // dvh, not svh: tracks mobile browsers' collapsing toolbars, matching
      // the body's min-h-dvh, so no gap opens below the shell.
      className="root-shell h-dvh min-h-0 overflow-hidden"
      defaultOpen={false}
      open={sidebars.isOpen('global')}
      onOpenChange={(open) => changeOpen('global', open)}
      // State is in memory until the owner chooses where it persists.
      cookieName={null}
    >
      <a className="root-skip-link" href="#root-main-content">
        Skip to content
      </a>
      <RootGlobalSidebar
        locked={sidebars.isLocked('global')}
        onToggleLock={() => sidebars.toggleLock('global')}
      >
        {globalSidebar}
      </RootGlobalSidebar>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <RootShellContent
          sidebars={sidebars}
          onChangeOpen={changeOpen}
          sidebar={sidebar}
          header={header}
        >
          {children}
        </RootShellContent>
      </div>
    </SidebarProvider>
  );
};

// Inner component: useSidebar() only works below SidebarProvider.
const RootShellContent = ({
  children,
  sidebars,
  onChangeOpen,
  sidebar,
  header,
}: {
  children: React.ReactNode;
  sidebars: ReturnType<typeof useExclusiveSidebars>;
  onChangeOpen: (id: SidebarId, open: boolean) => void;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
}) => {
  const { isMobile, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const headerHeight = useHeaderHeight();
  const globalPanel = useCollapsiblePanel({
    panelId: GLOBAL_PANEL_ID,
    defaultOpenPercent: GLOBAL_PANEL_DEFAULT_OPEN_PERCENT,
  });

  const canDismissGlobalPanel =
    !globalPanel.isCollapsed && !globalPanel.isLocked;
  // On mobile the global sidebar is a Sheet with its own overlay and Escape handling,
  // and the space sidebar is not rendered.
  // The space sidebar does not exist on /home, so a state left "open" from a nested route
  // must not capture outside clicks or Escape there.
  const dismissibleId = sidebars.dismissibleId;
  const dismissibleSidebar =
    isMobile || (dismissibleId === 'space' && !hasSpaceSidebar(pathname))
      ? null
      : dismissibleId;
  const closeDismissibleSidebar = () => {
    if (dismissibleSidebar) onChangeOpen(dismissibleSidebar, false);
  };
  const closeGlobalPanelOnEscape = () => {
    // Return keyboard focus before the panel's controls become inert.
    if (document.activeElement?.closest('[data-root-global-panel]')) {
      document
        .querySelector<HTMLButtonElement>(
          `[data-panel-toggle][aria-controls="${GLOBAL_PANEL_ID}"]`,
        )
        ?.focus({ preventScroll: true });
    }
    globalPanel.collapse();
  };

  useOutsideClick({
    enabled: canDismissGlobalPanel,
    onOutside: globalPanel.collapse,
    ignoreSelectors: GLOBAL_PANEL_INSIDE,
  });
  useOutsideClick({
    enabled: dismissibleSidebar !== null,
    onOutside: closeDismissibleSidebar,
    ignoreSelectors: SIDEBAR_INSIDE,
  });
  // One Escape closes the global panel if it can be dismissed, otherwise the open sidebar.
  useEscapeKey({
    enabled: canDismissGlobalPanel || dismissibleSidebar !== null,
    onEscape: canDismissGlobalPanel
      ? closeGlobalPanelOnEscape
      : closeDismissibleSidebar,
  });

  return (
    <RootCommandPaletteProvider
      onToggleSidebar={toggleSidebar}
      onToggleGlobalPanel={globalPanel.toggle}
    >
      <RootHeader
        isGlobalPanelOpen={!globalPanel.isCollapsed}
        onToggleGlobalPanelAction={globalPanel.toggle}
        globalPanelId={GLOBAL_PANEL_ID}
      />
      <ResizablePanelGroup
        orientation="vertical"
        className="min-h-0 flex-1"
        onLayoutChanged={globalPanel.onLayoutChanged}
      >
        <RootGlobalPanel
          id={GLOBAL_PANEL_ID}
          panelRef={globalPanel.panelRef}
          minSize={headerHeight}
          onResize={globalPanel.onResize}
          isCollapsed={globalPanel.isCollapsed}
          isLocked={globalPanel.isLocked}
          onToggleLock={globalPanel.toggleLock}
        />
        {/* The grip shows only while the panel is open: collapsed, the handle sits on
            the header's bottom border and the grip read as a stray mark. The handle
            itself stays draggable either way; the header toggle is the primary way in. */}
        <ResizableHandle
          aria-label="Resize global panel"
          withHandle={!globalPanel.isCollapsed}
          disableDoubleClick
        />
        <ResizablePanel
          defaultSize="100%"
          minSize={50}
          // Deliberate inline override: the library's overflow:auto must yield to the inner ScrollArea.
          style={{ overflow: 'hidden' }}
        >
          <SidebarProvider
            className="h-full min-h-0 w-full"
            defaultOpen={false}
            open={sidebars.isOpen('space')}
            onOpenChange={(open) => onChangeOpen('space', open)}
            // This provider's own toggle is the rail's button; Cmd/Ctrl+B stays with the
            // global sidebar for now (which sidebar finally owns it is an open decision).
            cookieName={null}
            keyboardShortcut={null}
          >
            <RootGlobalContent
              sidebar={sidebar}
              header={header}
              spaceLocked={sidebars.isLocked('space')}
              onToggleSpaceLock={() => sidebars.toggleLock('space')}
            >
              {children}
            </RootGlobalContent>
          </SidebarProvider>
        </ResizablePanel>
      </ResizablePanelGroup>
    </RootCommandPaletteProvider>
  );
};
```

- [ ] **Step 6: Pass the new slot from the root layout**

In `apps/web/app/layout.tsx` add `globalSidebar` next to `sidebar` and `header`:

```tsx
export default async function RootLayout({
  children,
  sidebar,
  globalSidebar,
  header,
}: {
  children: ReactNode;
  sidebar: ReactNode;
  globalSidebar: ReactNode;
  header: ReactNode;
}) {
```

```tsx
          <RootShell
            sidebar={sidebar}
            globalSidebar={globalSidebar}
            header={header}
          >
            {children}
          </RootShell>
```

- [ ] **Step 7: Run the unit tests and checks**

```bash
pnpm exec vitest run --project web
pnpm --filter @synapcity/web typecheck
pnpm exec eslint apps/web/components apps/web/app apps/web/hooks
pnpm exec prettier --check apps/web
pnpm deps
```

Expected: all pass. If the existing `root-global-sidebar.test.tsx` fails on the new footer, it is because it renders without `onToggleLock`; the lock button is rendered only when `onToggleLock` is given, so it should still pass. If `RootGlobalContent`'s tests fail because the space sidebar needs `matchMedia`, the existing `beforeEach` stub covers it.

- [ ] **Step 8: Check the frame in a browser before touching the spec**

Run the app (`pnpm --filter @synapcity/web dev`) and open `/home/spaces/example`. Confirm by eye, then with the numbers in Task 5, that: the global sidebar is full height and closed by default (the page uses the whole width); the root header starts to the right of it; the space sidebar shows as a 3rem icon rail under the header; the content header and page sit to the right of the rail. If the layout is wrong, stop and report. Do not change the spec to match a broken frame.

- [ ] **Step 9: Commit**

```bash
git add apps/web/components/root apps/web/app/layout.tsx
git commit -m "feat: restructure the shell into a global sidebar and a right-hand column"
```

---

### Task 5: Browser coverage and the existing spec

**Files:**

- Modify: `apps/web/tests/app-shell.spec.ts`

These tests need a browser and a free dev-server slot (the Playwright config builds the app and starts its own server on port 3100). Run them only where Chromium can run and no other `next dev` or `next build` holds the project lock; otherwise report them as not run.

**Helpers.** Replace the sidebar helpers near the top:

```ts
const globalSidebarToggle = (page: Page) =>
  page.locator('[data-sidebar-toggle="global"]');
const spaceSidebarToggle = (page: Page) =>
  page.locator('[data-sidebar-toggle="space"]');
const globalSidebar = (page: Page) =>
  page
    .locator('[data-slot="sidebar"]')
    .filter({ has: page.locator('[data-sidebar-id="global"]') });
const spaceSidebar = (page: Page) =>
  page
    .locator('[data-slot="sidebar"]')
    .filter({ has: page.locator('[data-sidebar-id="space"]') });
```

Keep `sidebarToggle` and `sidebar` as aliases of the global ones while updating call sites, then remove them.

**Existing tests to change** (by name in the `describe` blocks):

| Existing test or group | Change |
| --- | --- |
| `sidebar` helper users: `starts collapsed`, collapsed-controls-skipped, focus-return tests, `reopening restores keyboard access` | Point at `globalSidebar` and `globalSidebarToggle`. Behavior is unchanged. |
| `the open sidebar pushes the main area over` | Assert the right-hand column's left edge moves by the global sidebar's width when it opens. |
| `the sidebar follows the bottom panel when the global panel opens` | Rewrite for the space sidebar: it follows the lower panel, and the global sidebar does not (it is full height). |
| `sidebar content: has no product navigation...` | Update: the global sidebar keeps its switcher and appearance controls; the space sidebar keeps the neutral placeholder (no Home-specific entries exist), and `/home` has no space sidebar. |
| `dismissal > sidebar > an outside click leaves it open` | Invert: an outside click closes an unlocked sidebar. Rename accordingly. |
| `dismissal > header toggles` (sidebar toggle closes an unlocked panel; leaves a locked panel open; the panel toggle never closes the sidebar) | Keep, using `globalSidebarToggle`. |
| `at phone width the header keeps an icon-only palette trigger` | Add: at 390px the space sidebar rail is not in the DOM. |
| Tests that visit `/home` and then use the space sidebar | Visit a nested route such as `/home/spaces/example` instead: `/home` has no space sidebar. |

**New tests**, added to a new `test.describe('two sidebars', ...)`:

```ts
test.describe('two sidebars', () => {
  test('only one sidebar is open at a time', async ({ page }) => {
    await page.goto('/home/spaces/example', { waitUntil: 'networkidle' });

    await globalSidebarToggle(page).click();
    await expect(globalSidebar(page)).toHaveAttribute('data-state', 'expanded');

    await spaceSidebarToggle(page).click();
    await expect(spaceSidebar(page)).toHaveAttribute('data-state', 'expanded');
    await expect(globalSidebar(page)).toHaveAttribute('data-state', 'collapsed');

    await globalSidebarToggle(page).click();
    await expect(globalSidebar(page)).toHaveAttribute('data-state', 'expanded');
    await expect(spaceSidebar(page)).toHaveAttribute('data-state', 'collapsed');
  });

  test('the space sidebar is an icon rail by default, and its tooltip names the location', async ({
    page,
  }) => {
    await page.goto('/home/spaces/example', { waitUntil: 'networkidle' });

    await expect(spaceSidebar(page)).toHaveAttribute('data-state', 'collapsed');
    await spaceSidebarToggle(page).hover();
    await expect(page.getByRole('tooltip')).toContainText('Spaces');
  });

  test('/home has no space sidebar, and nested routes do', async ({ page }) => {
    await page.goto('/home', { waitUntil: 'networkidle' });
    await expect(page.locator('[data-sidebar-id="space"]')).toHaveCount(0);
    await expect(page.locator('[data-sidebar-id="global"]')).toHaveCount(1);

    await page.goto('/home/spaces/example', { waitUntil: 'networkidle' });
    await expect(page.locator('[data-sidebar-id="space"]')).toHaveCount(1);
  });

  test('Ctrl+B toggles the global sidebar and nothing else', async ({ page }) => {
    await page.goto('/home/spaces/example', { waitUntil: 'networkidle' });

    await page.keyboard.press('Control+b');

    await expect(globalSidebar(page)).toHaveAttribute('data-state', 'expanded');
    await expect(spaceSidebar(page)).toHaveAttribute('data-state', 'collapsed');
  });

  test('an outside click closes an unlocked sidebar, and a lock keeps it open', async ({
    page,
  }) => {
    await page.goto('/home', { waitUntil: 'networkidle' });
    await globalSidebarToggle(page).click();
    await page.getByRole('main').click({ position: { x: 300, y: 300 } });
    await expect(globalSidebar(page)).toHaveAttribute('data-state', 'collapsed');

    await globalSidebarToggle(page).click();
    await page.getByRole('button', { name: 'Lock global sidebar open' }).click();
    await page.getByRole('main').click({ position: { x: 300, y: 300 } });
    await expect(globalSidebar(page)).toHaveAttribute('data-state', 'expanded');
  });

  test('opening the command palette does not close an open sidebar', async ({
    page,
  }) => {
    await page.goto('/home', { waitUntil: 'networkidle' });
    await globalSidebarToggle(page).click();

    await page.getByRole('button', { name: 'Search or run a command' }).click();
    await page.getByPlaceholder('Search or run a command').click();

    await expect(globalSidebar(page)).toHaveAttribute('data-state', 'expanded');
  });

  test('closing a focused sidebar returns focus to its own toggle', async ({
    page,
  }) => {
    await page.goto('/home/spaces/example', { waitUntil: 'networkidle' });
    await spaceSidebarToggle(page).click();
    await spaceSidebarToggle(page).focus();

    await page.keyboard.press('Escape');

    await expect(spaceSidebarToggle(page)).toBeFocused();
    await expect(spaceSidebar(page)).toHaveAttribute('data-state', 'collapsed');
  });

  test('a hard load of a nested route fills both sidebar slots', async ({
    page,
  }) => {
    const response = await page.goto('/home/spaces/example', {
      waitUntil: 'networkidle',
    });

    expect(response?.status()).toBe(200);
    await expect(
      page.locator('[data-placeholder-region="sidebar"]'),
    ).toBeAttached();
    await expect(
      page.locator('[data-placeholder-region="global-sidebar"]'),
    ).toBeAttached();
  });
});
```

- [ ] **Step 1:** Apply the helper and existing-test changes, then add the new describe.
- [ ] **Step 2:** Run `pnpm --filter @synapcity/web exec playwright test -g "two sidebars"`. Expected: PASS. Then run the whole spec once: `pnpm test:smoke`. Fix failures one at a time; a failing existing test is a finding, not a reason to loosen it.
- [ ] **Step 3:** `pnpm exec eslint apps/web/tests && pnpm exec prettier --check apps/web/tests`.
- [ ] **Step 4:** Commit:

```bash
git add apps/web/tests/app-shell.spec.ts
git commit -m "test: cover the two-layer navigation shell"
```

---

### Task 6: Header auto-hide on `/home`, revealed by its triggers and by the global sidebar

**Files:**

- Modify: `apps/web/components/root/root-routes.ts` and extend `apps/web/components/root/root-routes.test.tsx`
- Create: `apps/web/hooks/use-root-header-reveal.ts` and `apps/web/hooks/use-root-header-reveal.test.tsx`
- Modify: `apps/web/components/root/root-header.tsx` and `apps/web/components/root/root-header.test.tsx`
- Modify: `apps/web/components/root/root-shell.tsx`
- Modify: `apps/web/tests/app-shell.spec.ts`

**Interfaces:**

- Produces: `isHomeRoute(pathname: string): boolean` (true for `/home` and `/home/...` only); `HEADER_HIDE_DELAY_MS = 400`; `useRootHeaderReveal({ enabled, holdOpen? })` returning `{ headerRef, hidden, reveal, scheduleHide }`; `RootHeader` gains `autoHide?: boolean` and `holdOpen?: boolean`, and its `<header>` carries `data-state="hidden" | "visible"`.
- Behavior (brief section 3.2, plus the owner's rule of 2026-10-06): the header hides only when `autoHide` is true and the device has a fine pointer; it returns on pointer over the header, the logo handle or the top-edge strip, and on keyboard focus entering it; it never hides while focus is inside it, a menu is open, or `holdOpen` is true. The shell sets `holdOpen` while the global sidebar is open, so opening it by any means reveals the header, which holds that sidebar's toggle. The revealed header overlays the content and does not push it. A hidden header keeps its box.
- The hide is CSS only, under Tailwind's `pointer-fine:` variant (`@media (pointer: fine)`), so server and client render the same markup and touch devices never hide it. This approximates the brief's `(hover: hover)`; the two differ on hybrid devices, and the owner can ask for the exact query.

- [ ] **Step 1: Write the failing route tests**

Extend `apps/web/components/root/root-routes.test.tsx` (created in Task 3): change its import to `import { hasSpaceSidebar, isHomeRoute } from './root-routes';` and add:

```tsx

describe('isHomeRoute', () => {
  it('matches /home and anything under it', () => {
    expect(isHomeRoute('/home')).toBe(true);
    expect(isHomeRoute('/home/')).toBe(true);
    expect(isHomeRoute('/home/spaces/abc')).toBe(true);
  });

  it('does not match look-alike or other routes', () => {
    expect(isHomeRoute('/')).toBe(false);
    expect(isHomeRoute('/homepage')).toBe(false);
    expect(isHomeRoute('/other/home')).toBe(false);
  });
});
```

Run: `pnpm exec vitest run --project web components/root/root-routes.test.tsx`
Expected: FAIL (`isHomeRoute` is not exported).

Append to `root-routes.ts`:

```ts
/** True for /home and every route under it. `/homepage` is deliberately not one. */
export function isHomeRoute(pathname: string): boolean {
  return pathname === '/home' || pathname.startsWith('/home/');
}
```

Re-run. Expected: PASS.

- [ ] **Step 2: Write the failing hook tests**

Create `apps/web/hooks/use-root-header-reveal.test.tsx`:

```tsx
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  HEADER_HIDE_DELAY_MS,
  useRootHeaderReveal,
} from './use-root-header-reveal';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('useRootHeaderReveal', () => {
  it('starts hidden when enabled', () => {
    const { result } = renderHook(() => useRootHeaderReveal({ enabled: true }));

    expect(result.current.hidden).toBe(true);
  });

  it('is never hidden when disabled', () => {
    const { result } = renderHook(() =>
      useRootHeaderReveal({ enabled: false }),
    );

    expect(result.current.hidden).toBe(false);
  });

  it('reveals at once and hides after the delay', () => {
    const { result } = renderHook(() => useRootHeaderReveal({ enabled: true }));

    act(() => result.current.reveal());
    expect(result.current.hidden).toBe(false);

    act(() => result.current.scheduleHide());
    act(() => vi.advanceTimersByTime(HEADER_HIDE_DELAY_MS - 1));
    expect(result.current.hidden).toBe(false);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.hidden).toBe(true);
  });

  it('cancels a pending hide when the pointer comes back', () => {
    const { result } = renderHook(() => useRootHeaderReveal({ enabled: true }));
    act(() => result.current.reveal());
    act(() => result.current.scheduleHide());

    act(() => vi.advanceTimersByTime(HEADER_HIDE_DELAY_MS - 50));
    act(() => result.current.reveal());
    act(() => vi.advanceTimersByTime(HEADER_HIDE_DELAY_MS));

    expect(result.current.hidden).toBe(false);
  });

  it('does not hide while keyboard focus is inside the header', () => {
    const { result } = renderHook(() => useRootHeaderReveal({ enabled: true }));
    const header = document.createElement('header');
    const button = document.createElement('button');
    header.append(button);
    document.body.append(header);
    result.current.headerRef.current = header;
    button.focus();

    act(() => result.current.reveal());
    act(() => result.current.scheduleHide());
    act(() => vi.advanceTimersByTime(HEADER_HIDE_DELAY_MS * 2));

    expect(result.current.hidden).toBe(false);
  });

  it('does not hide while a menu is open', () => {
    const { result } = renderHook(() => useRootHeaderReveal({ enabled: true }));
    const menu = document.createElement('div');
    menu.setAttribute('role', 'menu');
    document.body.append(menu);

    act(() => result.current.reveal());
    act(() => result.current.scheduleHide());
    act(() => vi.advanceTimersByTime(HEADER_HIDE_DELAY_MS * 2));

    expect(result.current.hidden).toBe(false);
  });

  it('is revealed while holdOpen is true, and lingers then hides once it is released', () => {
    const { result, rerender } = renderHook(
      ({ hold }) => useRootHeaderReveal({ enabled: true, holdOpen: hold }),
      { initialProps: { hold: false } },
    );
    expect(result.current.hidden).toBe(true);

    rerender({ hold: true });
    expect(result.current.hidden).toBe(false);
    act(() => vi.advanceTimersByTime(HEADER_HIDE_DELAY_MS * 3));
    expect(result.current.hidden).toBe(false);

    rerender({ hold: false });
    expect(result.current.hidden).toBe(false);
    act(() => vi.advanceTimersByTime(HEADER_HIDE_DELAY_MS));
    expect(result.current.hidden).toBe(true);
  });

  it('clears its timer when unmounted', () => {
    const { result, unmount } = renderHook(() =>
      useRootHeaderReveal({ enabled: true }),
    );
    act(() => result.current.reveal());
    act(() => result.current.scheduleHide());

    unmount();

    expect(() => vi.runAllTimers()).not.toThrow();
  });
});
```

Run: `pnpm exec vitest run --project web hooks/use-root-header-reveal.test.tsx`
Expected: FAIL ("Failed to resolve import ./use-root-header-reveal").

- [ ] **Step 3: Implement the hook**

Create `apps/web/hooks/use-root-header-reveal.ts`:

```ts
import * as React from 'react';

/** How long the header lingers after the pointer or focus leaves, so a slip does not hide it. */
export const HEADER_HIDE_DELAY_MS = 400;

/**
 * Reveal state for an auto-hiding header. This owns only "is it revealed"; the hiding
 * itself is CSS, gated by a media variant, so it never differs between server and client.
 * A hide is skipped, not queued, while keyboard focus is inside the header or a menu is
 * open (menus portal out of the header, so they are checked on the document); a later
 * blur or pointer leave schedules the next attempt. `holdOpen` keeps the header revealed
 * while something connected to it is open (the global sidebar, whose toggle lives on the
 * header); releasing it starts the normal delayed hide.
 */
export function useRootHeaderReveal({
  enabled,
  holdOpen = false,
}: {
  enabled: boolean;
  holdOpen?: boolean;
}) {
  const headerRef = React.useRef<HTMLElement | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [revealed, setRevealed] = React.useState(false);

  const cancelHide = React.useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const reveal = React.useCallback(() => {
    cancelHide();
    setRevealed(true);
  }, [cancelHide]);

  const scheduleHide = React.useCallback(() => {
    cancelHide();
    timer.current = setTimeout(() => {
      timer.current = null;
      if (headerRef.current?.contains(document.activeElement)) return;
      if (document.querySelector('[role="menu"]')) return;
      setRevealed(false);
    }, HEADER_HIDE_DELAY_MS);
  }, [cancelHide]);

  React.useEffect(() => {
    if (holdOpen) reveal();
    else scheduleHide();
  }, [holdOpen, reveal, scheduleHide]);

  React.useEffect(() => cancelHide, [cancelHide]);

  return {
    headerRef,
    hidden: enabled && !revealed && !holdOpen,
    reveal,
    scheduleHide,
  };
}
```

Run: `pnpm exec vitest run --project web hooks/use-root-header-reveal.test.tsx`
Expected: PASS (8 tests). If ESLint later flags a state update inside the effect, restructure so the effect only schedules and the reveal happens in an event or a timer; do not disable the rule.

- [ ] **Step 4: Write the failing header tests**

In `root-header.test.tsx`, add `afterEach` to the vitest import and add:

```tsx
  describe('auto-hide', () => {
    const header = () => screen.getByRole('banner');

    it('is always visible when autoHide is off, with no handle or edge strip', () => {
      renderHeader();

      expect(header()).toHaveAttribute('data-state', 'visible');
      expect(document.querySelector('[data-header-handle]')).toBeNull();
      expect(document.querySelector('[data-header-edge]')).toBeNull();
    });

    it('starts hidden when autoHide is on, but stays in the tab order', () => {
      renderHeader({ autoHide: true });

      expect(header()).toHaveAttribute('data-state', 'hidden');
      expect(
        screen.getByRole('button', { name: 'Toggle global panel' }),
      ).not.toHaveAttribute('tabindex', '-1');
      expect(header()).not.toHaveAttribute('inert');
    });

    it('is revealed by the pointer over the header, the handle and the edge strip', () => {
      for (const target of [
        () => header(),
        () => document.querySelector('[data-header-handle]') as Element,
        () => document.querySelector('[data-header-edge]') as Element,
      ]) {
        const view = render(<></>);
        view.unmount();
        renderHeader({ autoHide: true });

        fireEvent.pointerEnter(target());

        expect(header()).toHaveAttribute('data-state', 'visible');
        document.body.innerHTML = '';
      }
    });

    it('is revealed when keyboard focus enters it', () => {
      renderHeader({ autoHide: true });

      fireEvent.focus(
        screen.getByRole('button', { name: 'Toggle global panel' }),
      );

      expect(header()).toHaveAttribute('data-state', 'visible');
    });

    it('is revealed while holdOpen is true', () => {
      renderHeader({ autoHide: true, holdOpen: true });

      expect(header()).toHaveAttribute('data-state', 'visible');
    });

    it('hides the handle while the header is revealed, so the wordmark is not doubled', () => {
      renderHeader({ autoHide: true, holdOpen: true });

      expect(document.querySelector('[data-header-handle]')).toHaveAttribute(
        'data-state',
        'visible',
      );
    });
  });
```

and extend `renderHeader`'s prop type if needed (it already takes `Partial<Parameters<typeof RootHeader>[0]>`).

(The loop-with-render in the pointer test is clumsy; split it into three small `it` cases if it reads badly. Each must render fresh and assert `data-state` becomes `visible`.)

Run: `pnpm exec vitest run --project web components/root/root-header.test.tsx`
Expected: FAIL (the new props and attributes do not exist).

- [ ] **Step 5: Implement the header structure**

Replace `root-header.tsx`:

```tsx
'use client';

import * as React from 'react';
import { PanelToggleButton } from '@synapcity/ui-core/layouts/panel';
import { cn } from '../../lib/utils';
import { useRootHeaderReveal } from '../../hooks/use-root-header-reveal';
import { RootNavigation } from './root-navigation';

export interface RootHeaderProps {
  isGlobalPanelOpen: boolean;
  onToggleGlobalPanelAction: () => void;
  globalPanelId: string;
  /** Hides the header until a return trigger is used. Only takes effect with a fine pointer. */
  autoHide?: boolean;
  /** Keeps the header revealed while something connected to it is open. */
  holdOpen?: boolean;
}

/**
 * The root header. With `autoHide` it slides out of view for pointer devices and returns
 * on its triggers (see useRootHeaderReveal). It overlays the content when revealed and
 * keeps its box when hidden, so `--header-height` and the Global panel's toolbar row do
 * not change. Hiding is CSS under `pointer-fine:`, so touch devices never hide it. It
 * stays focusable while hidden: focus entering it reveals it.
 */
export function RootHeader({
  isGlobalPanelOpen,
  onToggleGlobalPanelAction,
  globalPanelId,
  autoHide = false,
  holdOpen = false,
}: RootHeaderProps) {
  const { headerRef, hidden, reveal, scheduleHide } = useRootHeaderReveal({
    enabled: autoHide,
    holdOpen,
  });
  const state = hidden ? 'hidden' : 'visible';

  return (
    <>
      {autoHide && (
        <>
          {/* Pointer-only affordances: the header itself is the keyboard route in, so
              neither needs a name or a tab stop. */}
          <div
            aria-hidden="true"
            data-header-edge=""
            onPointerEnter={reveal}
            onPointerLeave={scheduleHide}
            className="absolute inset-x-0 top-0 z-40 hidden h-1.5 pointer-fine:block"
          />
          <div
            aria-hidden="true"
            data-header-handle=""
            data-state={state}
            onPointerEnter={reveal}
            onPointerLeave={scheduleHide}
            className="absolute top-0 left-0 z-40 hidden h-8 w-12 items-center justify-center text-muted-foreground transition-opacity duration-200 motion-reduce:transition-none pointer-fine:flex data-[state=visible]:opacity-0"
          >
            <svg viewBox="0 0 64 64" fill="currentColor" className="size-5">
              <rect x="10" y="14" width="30" height="30" rx="9" fill="none" stroke="currentColor" strokeWidth="2.25" />
              <rect x="24" y="24" width="30" height="30" rx="9" fill="none" stroke="currentColor" strokeWidth="2.25" />
              <rect x="23" y="23" width="18" height="22" rx="2" />
            </svg>
          </div>
        </>
      )}
      <header
        ref={headerRef}
        data-state={state}
        data-auto-hide={autoHide ? '' : undefined}
        onPointerEnter={autoHide ? reveal : undefined}
        onPointerLeave={autoHide ? scheduleHide : undefined}
        onFocus={autoHide ? reveal : undefined}
        onBlur={autoHide ? scheduleHide : undefined}
        className={cn(
          'sticky top-0 z-50 flex w-full items-center border-b bg-background',
          // Auto-hide: overlay the content and slide up out of view. Fine pointers only.
          'transition-transform duration-200 motion-reduce:transition-none',
          'pointer-fine:data-auto-hide:absolute pointer-fine:data-auto-hide:inset-x-0 pointer-fine:data-auto-hide:top-0',
          'pointer-fine:data-[state=hidden]:-translate-y-full',
        )}
      >
        <RootNavigation
          globalPanelToggle={
            <PanelToggleButton
              isExpanded={isGlobalPanelOpen}
              controlsId={globalPanelId}
              label="Toggle global panel"
              onToggle={onToggleGlobalPanelAction}
            />
          }
        />
      </header>
    </>
  );
}
```

The `<svg>` mark is the repository's own mark from `apps/web/public/brand-assets/mark-monochrome.svg` (three rectangles, `currentColor`), inlined so it takes the theme colour; reformat the long `<rect>` lines with Prettier. Confirm the `cn` import path matches the file's depth (`apps/web/lib/utils`).

Run the header tests. Expected: PASS. Then `pnpm exec eslint apps/web/components/root apps/web/hooks`.

- [ ] **Step 6: Wire the shell**

In `root-shell.tsx`:

1. Import `isHomeRoute` from `./root-routes` (extend the existing import that already brings in `hasSpaceSidebar`). `usePathname` is already imported and `pathname` already read in `RootShellContent` (Task 4).
2. In `RootShellContent`, add `const autoHide = isHomeRoute(pathname);`.
3. Pass the new props to the header:

```tsx
      <RootHeader
        isGlobalPanelOpen={!globalPanel.isCollapsed}
        onToggleGlobalPanelAction={globalPanel.toggle}
        globalPanelId={GLOBAL_PANEL_ID}
        autoHide={autoHide}
        // The global sidebar's toggle lives on the header, so opening that sidebar by any
        // means (the toggle, Ctrl+B, the palette) keeps the header revealed.
        holdOpen={sidebars.isOpen('global')}
      />
```

4. Make the right-hand column the overlay's positioning context: in `RootShell`, change `className="flex min-h-0 min-w-0 flex-1 flex-col"` on the right column to `className="relative flex min-h-0 min-w-0 flex-1 flex-col"`.

Run `pnpm --filter @synapcity/web typecheck && pnpm exec vitest run --project web`. Expected: PASS.

- [ ] **Step 7: Browser coverage**

In `app-shell.spec.ts`:

1. Add a helper and use it wherever a test touches the header's controls on `/home` (the `beforeEach` that waits for the global panel toggle, and every test that clicks the header):

```ts
// On /home the header is hidden for pointer devices until a trigger is used.
async function revealHeader(page: Page) {
  await page.mouse.move(640, 2);
  await expect(page.locator('header')).toHaveAttribute('data-state', 'visible');
}
```

2. Add a new `test.describe('header auto-hide', ...)`:

```ts
test.describe('header auto-hide', () => {
  test('is hidden on /home for a pointer device, and keeps its box', async ({ page }) => {
    await page.goto('/home', { waitUntil: 'networkidle' });
    const header = page.locator('header');

    await expect(header).toHaveAttribute('data-state', 'hidden');
    const box = await header.boundingBox();
    expect(box?.height).toBeGreaterThan(0);
    expect(
      await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--header-height'),
      ),
    ).not.toBe('0px');
  });

  test('the top-edge strip and the logo handle reveal it', async ({ page }) => {
    await page.goto('/home', { waitUntil: 'networkidle' });
    await page.mouse.move(640, 2);
    await expect(page.locator('header')).toHaveAttribute('data-state', 'visible');

    await page.mouse.move(640, 500);
    await expect(page.locator('header')).toHaveAttribute('data-state', 'hidden');

    await page.locator('[data-header-handle]').hover();
    await expect(page.locator('header')).toHaveAttribute('data-state', 'visible');
  });

  test('keyboard focus entering it reveals it, and it stays while focus is inside', async ({
    page,
  }) => {
    await page.goto('/home', { waitUntil: 'networkidle' });

    await page.keyboard.press('Tab'); // skip link
    await page.keyboard.press('Tab'); // first header control
    await expect(page.locator('header')).toHaveAttribute('data-state', 'visible');

    await page.mouse.move(640, 600);
    await page.waitForTimeout(700);
    await expect(page.locator('header')).toHaveAttribute('data-state', 'visible');
  });

  test('opening the global sidebar with Ctrl+B reveals the header and holds it open', async ({
    page,
  }) => {
    await page.goto('/home', { waitUntil: 'networkidle' });
    await expect(page.locator('header')).toHaveAttribute('data-state', 'hidden');

    await page.keyboard.press('Control+b');

    await expect(page.locator('header')).toHaveAttribute('data-state', 'visible');
    await page.waitForTimeout(700);
    await expect(page.locator('header')).toHaveAttribute('data-state', 'visible');
  });

  test('Ctrl+K opens the palette while the header is hidden', async ({ page }) => {
    await page.goto('/home', { waitUntil: 'networkidle' });

    await page.keyboard.press('Control+k');

    await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible();
  });

  test('is never hidden outside /home', async ({ page }) => {
    await page.goto('/this-route-does-not-exist', { waitUntil: 'networkidle' });

    await expect(page.locator('header')).toHaveAttribute('data-state', 'visible');
  });
});

test.describe('header auto-hide on touch', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test('is never hidden under touch emulation', async ({ page }) => {
    await page.goto('/home', { waitUntil: 'networkidle' });

    const box = await page.locator('header').boundingBox();
    expect(box?.y).toBeGreaterThanOrEqual(0);
  });
});
```

3. Run `pnpm --filter @synapcity/web exec playwright test -g "header auto-hide"`, then the whole spec once (`pnpm test:smoke`). These need a browser and a free dev-server slot; otherwise report them as not run. A failing existing test is a finding: usually it needs `revealHeader` before it touches the header.

- [ ] **Step 8: Verify and commit**

```bash
pnpm --filter @synapcity/web typecheck
pnpm exec eslint apps/web
pnpm exec prettier --check apps/web
pnpm deps
git add apps/web
git commit -m "feat: hide the root header on home routes and reveal it with the global sidebar"
```

---

## Self-review

- **Spec coverage:** header auto-hide, its triggers, and the rule that the global sidebar reveals it (Task 6); layout (Task 4), push for both (Task 4, existing offcanvas and icon modes push through the gap element), one open at a time (Task 2, Task 4), outside click and lock trial (Task 2, Task 4, Task 5), one provider per sidebar and the hook (Tasks 1, 2, 4), cookie and shortcut collisions (Task 1, Task 4), surface split and slots (Tasks 3, 4), no space sidebar on `/home` (Tasks 3, 4, 5), the rail's tooltip (Task 3, Task 5). Not covered by design: see "Not in this plan" (the reveal shortcut key, persistence, space icons, creation defaults, mobile space navigation, `⌘/Ctrl+B` ownership).
- **Placeholders:** none. The two conditional notes (the mobile test's stub, and the existing sidebar test) name the file to read and what to adjust.
- **Type consistency:** `SidebarId`, `useExclusiveSidebars()` members, `RootSpaceSidebar` props, `RootGlobalContent` props (`spaceLocked`, `onToggleSpaceLock`) and the `data-sidebar-id` and `data-sidebar-toggle` markers are used identically across Tasks 2 to 5.
- **Known weak points a reviewer should check first:** the nested providers' wrapper `div`s and the `min-h-svh` default in the provider's class list (Task 4 overrides it with `h-full min-h-0` and `h-dvh min-h-0`); and whether `RootGlobalSidebar` fixed positioning (`z-10`) stacks correctly under the header's `z-50` and the palette dialog.

## Execution

Native execution (one session, test first, with a fresh review of the whole branch at the end) fits this plan: the tasks share interfaces closely, and the riskiest step (Task 4) needs one mind holding the whole frame. A mistake in Task 4 costs a layout regression across every route, so a final independent review is worth it.
