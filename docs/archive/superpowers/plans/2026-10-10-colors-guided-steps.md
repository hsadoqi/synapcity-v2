# Colors Guided Steps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the `/theme` Colors section into a guided Primary → Harmony → Accent flow with labelled swatch cards, including a "None" accent tile.

**Architecture:** `ColorsSection` renders three numbered `CollapsibleStep`s whose open state is local UI state. The existing `PresetGroup` gains `hint`, `dashed` and `ariaLabel` so it renders the reference's cards. `ColorsProvider.accentIndex` becomes `number | null` (`null` = derived accent), with `accentSourceFor` handling `null`.

**Tech Stack:** React, Next (apps/web), Tailwind tokens, Vitest + Testing Library, `@synapcity/frontend-uiontend-ui-core`.

**Spec:** `docs/superpowers/specs/2026-10-10-colors-guided-steps-design.md`

## Global Constraints

- `apps/web/components/theme/` is the canonical editor; do not touch `packages/ui/core/.../theme-editor`.
- `ColorsProvider` defaults stay blue / analogous / accent 1.
- Theme tokens and Tailwind scale steps only; no bracket values, no hardcoded colours, no `dark:` colours; `className` for layout only; merge with `cn()`.
- Swatch colours use the existing `variables({'--primary': toCss(color)})` / `paintStyle` mechanism.
- Animations are `motion-safe:` only.
- Do not commit: these files are untracked WIP mixed with the owner's unfinished work. Leave the tree uncommitted and report.
- Run tests from `apps/web`: `pnpm vitest run <path>`. Tests use `fireEvent`/`getAttribute` (do not assume `jest-dom` or `user-event` are installed).
- Out of scope: provider defaults, split layout, Typography/Display, `globals.css` design-system findings, preview components.

## Review Focus

- Harmony `none` (no extra colours): the Accent step shows only the "None" tile, selected, and nothing crashes. (Task 4)
- Changing harmony while "None" accent is selected resets accent to index 1 (existing behaviour; pin it). (Task 1)
- Dragging the custom-primary sliders must not auto-open Harmony or steal focus. (Task 4)
- Reset while the Accent step is open collapses to step 1 only. (Task 4)
- Arrow keys in the Accent radiogroup wrap through all tiles including "None". (Task 4)

---

### Task 1: Derived accent (`null`) in color-math and provider

**Files:**
- Modify: `apps/web/components/theme/lib/color-math.ts:338-346`
- Modify: `apps/web/components/theme/providers/color-provider.tsx`
- Create: `apps/web/components/theme/lib/color-math.test.ts`
- Create: `apps/web/components/theme/providers/color-provider.test.tsx`

**Interfaces:**
- Produces: `accentSourceFor(primary: Oklch, harmony: HarmonyId, index: number | null): Oklch | null`; `useColors().accentIndex: number | null`; `useColors().setAccent(accentIndex: number | null): void`; `useColors().resetCount: number` (increments on every `reset()`).

- [ ] **Step 1: Write the failing tests**

`color-math.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { PRESETS, accentSourceFor, harmonyColors } from './color-math';

const base = PRESETS[0].color;

describe('accentSourceFor', () => {
  it('returns the harmony colour at the index', () => {
    expect(accentSourceFor(base, 'triadic', 2)).toEqual(
      harmonyColors('triadic', base)[2],
    );
  });

  it('returns null (derived accent) for a null index under any harmony', () => {
    expect(accentSourceFor(base, 'triadic', null)).toBeNull();
  });

  it('returns null for the none harmony', () => {
    expect(accentSourceFor(base, 'none', 1)).toBeNull();
  });
});
```

`color-provider.test.tsx`:

```tsx
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ColorsProvider, useColors } from './color-provider';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ColorsProvider>{children}</ColorsProvider>
);

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

describe('ColorsProvider accent', () => {
  it('starts on accent 1', () => {
    const { result } = renderHook(() => useColors(), { wrapper });
    expect(result.current.accentIndex).toBe(1);
  });

  it('accepts null for a derived accent', () => {
    const { result } = renderHook(() => useColors(), { wrapper });
    act(() => result.current.setAccent(null));
    expect(result.current.accentIndex).toBeNull();
    expect(result.current.message).toMatch(/soft tint derived/i);
  });

  it('resets the accent to 1 when the harmony changes after None', () => {
    const { result } = renderHook(() => useColors(), { wrapper });
    act(() => result.current.setAccent(null));
    act(() => result.current.setHarmony('triadic'));
    expect(result.current.accentIndex).toBe(1);
  });

  it('increments resetCount on reset', () => {
    const { result } = renderHook(() => useColors(), { wrapper });
    const before = result.current.resetCount;
    act(() => result.current.reset());
    expect(result.current.resetCount).toBe(before + 1);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run (in `apps/web`): `pnpm vitest run components/theme/lib/color-math.test.ts components/theme/providers/color-provider.test.tsx`
Expected: FAIL (type/behaviour: `null` index, `resetCount` undefined).

- [ ] **Step 3: Implement**

In `color-math.ts` replace the function signature and first line of `accentSourceFor`:

```ts
export function accentSourceFor(
  primary: Oklch,
  harmony: HarmonyId,
  index: number | null,
): Oklch | null {
  if (harmony === 'none' || index === null) return null;
  const colors = harmonyColors(harmony, primary);
  return colors[index] ?? colors[1] ?? null;
}
```

Also update the doc comment above it to say `null` index means "derived".

In `color-provider.tsx`: type the defaults and state explicitly, add `resetCount`, and widen `setAccent`.

```ts
type ColorsState = {
  mode: Mode;
  primary: Oklch;
  preset: string;
  harmony: HarmonyId;
  accentIndex: number | null;
  customOpen: boolean;
};

const DEFAULT_COLORS: ColorsState = {
  mode: 'light',
  primary: DEFAULT_PRESET.color,
  preset: DEFAULT_PRESET.id,
  harmony: 'analogous',
  accentIndex: 1,
  customOpen: false,
};
```

Inside `useColorsState`: `const [state, setState] = useState<ColorsState>(DEFAULT_COLORS);` and `const [resetCount, setResetCount] = useState(0);`. Return `resetCount` alongside `message`. Replace `setAccent` and `reset`:

```ts
    setAccent: (accentIndex: number | null) => {
      setState((s) => ({ ...s, accentIndex }));
      announce(
        accentIndex === null
          ? 'Accent set to a soft tint derived from primary'
          : `Accent set to color ${accentIndex}`,
      );
    },
    reset: () => {
      setState(DEFAULT_COLORS);
      setResetCount((n) => n + 1);
      announce('Colors reset');
    },
```

- [ ] **Step 4: Run to verify pass**

Run: same command as Step 2. Expected: PASS. Then `pnpm typecheck` from the repo root; fix any caller type errors (`accentIndex` consumers: `colors-section.tsx`, `accent-group.tsx`; these are rewritten in Task 4, so a temporary error there is acceptable until then).

---

### Task 2: `PresetGroup` swatch-card options

**Files:**
- Modify: `apps/web/components/theme/components/controls/preset-group.tsx`
- Create: `apps/web/components/theme/components/controls/preset-group.test.tsx`

**Interfaces:**
- Produces: `Choice` gains `hint?: string`, `dashed?: boolean`, `ariaLabel?: string`. `aria-label` becomes `option.ariaLabel ?? option.label`.

- [ ] **Step 1: Write the failing test**

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PresetGroup } from './preset-group';

const options = [
  { value: 'a', label: 'Green', hint: '140°' },
  { value: 'none', label: 'None', hint: 'tint', dashed: true, ariaLabel: 'None, derive a soft accent' },
];

describe('PresetGroup cards', () => {
  it('shows the hint and uses ariaLabel as the accessible name', () => {
    render(<PresetGroup label="Accent" value="a" options={options} onChange={() => {}} />);
    expect(screen.getByText('140°')).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'None, derive a soft accent' })).toBeTruthy();
  });

  it('marks dashed options with a dashed border', () => {
    render(<PresetGroup label="Accent" value="a" options={options} onChange={() => {}} />);
    const none = screen.getByRole('radio', { name: 'None, derive a soft accent' });
    expect(none.className).toContain('border-dashed');
    expect(screen.getByRole('radio', { name: 'Green' }).className).not.toContain('border-dashed');
  });

  it('calls onChange and wraps arrow-key focus', () => {
    const onChange = vi.fn();
    render(<PresetGroup label="Accent" value="a" options={options} onChange={onChange} />);
    const green = screen.getByRole('radio', { name: 'Green' });
    green.focus();
    fireEvent.keyDown(green, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(
      screen.getByRole('radio', { name: 'None, derive a soft accent' }),
    );
    fireEvent.click(green);
    expect(onChange).toHaveBeenCalledWith('a');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run components/theme/components/controls/preset-group.test.tsx`
Expected: FAIL (hint not rendered, no dashed class).

- [ ] **Step 3: Implement**

Extend the type:

```ts
export type Choice = {
  value: string;
  label: string;
  hint?: string;
  dashed?: boolean;
  ariaLabel?: string;
  visual?: ReactNode;
  style?: CSSProperties;
};
```

On the `<button>`: `aria-label={option.ariaLabel ?? option.label}`, add `option.dashed && 'border-dashed'` as another `cn()` argument, and render the hint directly after the existing label `<span>`:

```tsx
          {option.hint && (
            <span className="w-full truncate text-xs text-muted-foreground">
              {option.hint}
            </span>
          )}
```

- [ ] **Step 4: Run to verify pass**

Run: same command. Expected: PASS.

---

### Task 3: `CollapsibleStep` control

**Files:**
- Create: `apps/web/components/theme/components/controls/collapsible-step.tsx`
- Create: `apps/web/components/theme/components/controls/collapsible-step.test.tsx`
- Modify: `apps/web/components/theme/components/controls/index.ts` (add export)

**Interfaces:**
- Produces:

```ts
export function CollapsibleStep(props: {
  number: number;
  title: string;
  description: string;
  open: boolean;
  onToggle: () => void;
  headerRef?: (node: HTMLButtonElement | null) => void;
  summary?: ReactNode;
  children: ReactNode;
}): JSX.Element
```

- [ ] **Step 1: Write the failing test**

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CollapsibleStep } from './collapsible-step';

const base = { number: 1, title: 'Primary', description: 'The base colour.' };

describe('CollapsibleStep', () => {
  it('shows the panel and description when open', () => {
    render(<CollapsibleStep {...base} open onToggle={() => {}} summary="Blue">body</CollapsibleStep>);
    const header = screen.getByRole('button', { name: /^01\s*Primary/ });
    expect(header.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('body')).toBeTruthy();
    expect(screen.getByText('The base colour.')).toBeTruthy();
    expect(screen.queryByText('Blue')).toBeNull();
  });

  it('hides the panel and shows the summary when closed', () => {
    render(<CollapsibleStep {...base} open={false} onToggle={() => {}} summary="Blue">body</CollapsibleStep>);
    expect(screen.getByRole('button', { name: /^01\s*Primary/ }).getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('body')).toBeNull();
    expect(screen.getByText('Blue')).toBeTruthy();
  });

  it('calls onToggle on click and exposes the header via headerRef', () => {
    const onToggle = vi.fn();
    let node: HTMLButtonElement | null = null;
    render(
      <CollapsibleStep {...base} open onToggle={onToggle} headerRef={(n) => { node = n; }}>
        body
      </CollapsibleStep>,
    );
    fireEvent.click(screen.getByRole('button', { name: /^01\s*Primary/ }));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(node).toBe(screen.getByRole('button', { name: /^01\s*Primary/ }));
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run components/theme/components/controls/collapsible-step.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```tsx
'use client';

import { ChevronDown } from 'lucide-react';
import { type ReactNode, useId } from 'react';
import { cn } from '../../../../lib/utils';

const enter =
  'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300';

export function CollapsibleStep({
  number,
  title,
  description,
  open,
  onToggle,
  headerRef,
  summary,
  children,
}: {
  number: number;
  title: string;
  description: string;
  open: boolean;
  onToggle: () => void;
  headerRef?: (node: HTMLButtonElement | null) => void;
  summary?: ReactNode;
  children: ReactNode;
}) {
  const panelId = useId();
  return (
    <div className={cn('border-t border-border first:border-t-0', enter)}>
      <h3>
        <button
          ref={headerRef}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-3 rounded-sm py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="flex items-baseline gap-2">
              <span className="font-mono text-xs text-muted-foreground">{`0${number}`}</span>
              <span className="text-sm font-medium">{title}</span>
            </span>
            {open && (
              <span className="truncate text-xs text-muted-foreground">{description}</span>
            )}
          </span>
          <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
            {!open && summary}
            <ChevronDown
              aria-hidden="true"
              className={cn('size-4 motion-safe:transition-transform', open && 'rotate-180')}
            />
          </span>
        </button>
      </h3>
      {open && (
        <div id={panelId} className={cn('flex flex-col gap-4 pb-5 pt-1', enter)}>
          {children}
        </div>
      )}
    </div>
  );
}
```

Add to `controls/index.ts`: `export { CollapsibleStep } from './collapsible-step';`

- [ ] **Step 4: Run to verify pass**

Run: same command. Expected: PASS.

---

### Task 4: Guided Colors section

**Files:**
- Modify: `apps/web/components/theme/components/sections/colors-section.tsx`
- Modify: `apps/web/components/theme/components/sections/color-groups/{mode,primary,harmony,accent}-group.tsx`
- Create: `apps/web/components/theme/components/sections/colors-section.test.tsx`

**Interfaces:**
- Consumes: Task 1 (`accentIndex: number | null`, `setAccent(number | null)`, `resetCount`), Task 2 (`Choice.hint/dashed/ariaLabel`), Task 3 (`CollapsibleStep`).
- Produces (group components now render step *bodies*, no `LabeledGroup`):
  - `PrimaryGroup` props gain `onChosen?: () => void` (called only when a non-custom preset is picked).
  - `HarmonyGroup` props gain `onChosen?: () => void`.
  - `AccentGroup` props: `{ primary, harmony, accentIndex: number | null, setAccent(_i: number | null): void, tokens, onChangeHarmony(): void, onChangePrimary(): void }`.
  - `ModeGroup` renders a compact labelled row (no `LabeledGroup`).

- [ ] **Step 1: Write the failing tests**

```tsx
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ColorsProvider, useColors } from '../../providers/color-provider';
import { ColorsSection } from './colors-section';

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

function ResetHarness() {
  const c = useColors();
  return <button onClick={c.reset}>reset-all</button>;
}

const setup = () =>
  render(
    <ColorsProvider>
      <ResetHarness />
      <ColorsSection />
    </ColorsProvider>,
  );

const header = (name: string) =>
  screen.getByRole('button', { name: new RegExp(`^0\\d\\s*${name}`) });
const expanded = (name: string) => header(name).getAttribute('aria-expanded');

describe('ColorsSection guided steps', () => {
  it('opens only Primary on load', () => {
    setup();
    expect(expanded('Primary')).toBe('true');
    expect(expanded('Harmony')).toBe('false');
    expect(expanded('Accent')).toBe('false');
  });

  it('opens Harmony after a preset primary is chosen', () => {
    setup();
    const group = screen.getByRole('radiogroup', { name: 'Primary color' });
    const other = within(group)
      .getAllByRole('radio')
      .find((r) => r.getAttribute('aria-checked') === 'false' && r.getAttribute('aria-label') !== 'Custom')!;
    fireEvent.click(other);
    expect(expanded('Harmony')).toBe('true');
  });

  it('does not open Harmony while editing a custom primary', () => {
    setup();
    fireEvent.click(screen.getByRole('radio', { name: 'Custom' }));
    expect(expanded('Harmony')).toBe('false');
  });

  it('opens only Accent after a harmony is chosen', () => {
    setup();
    fireEvent.click(header('Harmony'));
    fireEvent.click(screen.getByRole('radio', { name: 'Triadic' }));
    expect(expanded('Accent')).toBe('true');
    expect(expanded('Harmony')).toBe('false');
    expect(expanded('Primary')).toBe('false');
  });

  it('selects the None accent tile', () => {
    setup();
    fireEvent.click(header('Accent'));
    const none = screen.getByRole('radio', { name: /^None, derive a soft accent/ });
    fireEvent.click(none);
    expect(none.getAttribute('aria-checked')).toBe('true');
  });

  it('wraps arrow-key focus through the None tile', () => {
    setup();
    fireEvent.click(header('Accent'));
    const group = screen.getByRole('radiogroup', { name: 'Accent color' });
    const radios = within(group).getAllByRole('radio');
    radios[radios.length - 1].focus();
    fireEvent.keyDown(radios[radios.length - 1], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(radios[0]);
  });

  it('shows only the None tile, selected, under the none harmony', () => {
    setup();
    fireEvent.click(header('Harmony'));
    fireEvent.click(screen.getByRole('radio', { name: 'None' }));
    const radios = within(screen.getByRole('radiogroup', { name: 'Accent color' })).getAllByRole('radio');
    expect(radios).toHaveLength(1);
  });

  it('Change harmony re-opens Harmony and focuses its header', () => {
    setup();
    fireEvent.click(header('Accent'));
    fireEvent.click(screen.getByRole('button', { name: 'Change harmony' }));
    expect(expanded('Harmony')).toBe('true');
    expect(document.activeElement).toBe(header('Harmony'));
  });

  it('collapses back to Primary only on reset', () => {
    setup();
    fireEvent.click(header('Accent'));
    expect(expanded('Accent')).toBe('true');
    act(() => {
      fireEvent.click(screen.getByText('reset-all'));
    });
    expect(expanded('Primary')).toBe('true');
    expect(expanded('Accent')).toBe('false');
  });
});
```

Note: the Harmony "None" radio and the Accent "None, derive…" radio never coexist in the DOM in the "none harmony" test because Harmony collapses after choosing; if both do coexist during implementation, scope queries with `within(radiogroup)`.

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run components/theme/components/sections/colors-section.test.tsx`
Expected: FAIL (no step headers).

- [ ] **Step 3: Implement the groups**

`mode-group.tsx` body (drop `LabeledGroup`):

```tsx
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">Mode</span>
      <PresetGroup
        label="Mode"
        value={selectedMode}
        onChange={(v) => onSelectMode(v as Mode)}
        className="grid-cols-3"
        compact
        options={modeOptions(system)}
      />
    </div>
  );
```

`primary-group.tsx`: remove `LabeledGroup`; return a fragment `<>…</>` containing the `PresetGroup` and the custom `<details>` block unchanged. Add `onChosen?: () => void` to props; in the `PresetGroup` `onChange` handler, after `setPrimary(...)` add `if (id !== CUSTOM) onChosen?.();`. Remove the unused `variables` import if no longer used. Add a one-line current-value readout under the group, matching the reference:

```tsx
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-foreground">
          {PRESETS.find((p) => p.id === preset)?.name ?? 'Custom'}
        </span>
        <span aria-hidden="true">·</span>
        <span className="font-mono text-xs">{toCss(primary)}</span>
      </p>
```

`harmony-group.tsx`: drop `LabeledGroup`, return the `PresetGroup`, give each option `hint: h.hint`, `dashed: h.id === 'none'`, and add `onChosen?: () => void` called after `setHarmony`.

`accent-group.tsx`: full replacement:

```tsx
'use client';

import { Check } from 'lucide-react';
import { Button } from '@synapcity/frontend-uiontend-ui-core/components';
import {
  harmonyColors,
  hueName,
  paintStyle,
  resolveTokens,
  toCss,
  type HarmonyId,
  type ModeTokens,
  type Oklch,
} from '../../../lib/color-math';
import { PresetGroup, variables } from '../../controls';
import { ColorRamps } from '../shared/color-ramps';

interface AccentGroupProps {
  primary: Oklch;
  harmony: HarmonyId;
  accentIndex: number | null;
  setAccent: (_index: number | null) => void;
  // The resolved tokens for the mode the editor is showing: both ramps.
  tokens: ModeTokens;
  onChangeHarmony: () => void;
  onChangePrimary: () => void;
}

const NONE = 'none';

const chip = (color: Oklch) => (
  <span
    className="size-8 rounded-sm bg-primary"
    style={variables({ '--primary': toCss(color) })}
  />
);

export function AccentGroup({
  primary,
  harmony,
  accentIndex,
  setAccent,
  tokens,
  onChangeHarmony,
  onChangePrimary,
}: AccentGroupProps) {
  const palette = harmonyColors(harmony, primary);
  const derived = resolveTokens(primary, null, 'light').accent;
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-2">
            <span
              className="flex size-10 items-center justify-center rounded-sm bg-primary text-primary-foreground"
              style={paintStyle(primary)}
            >
              <Check aria-hidden="true" className="size-4" />
            </span>
            <span className="text-xs text-muted-foreground">Primary</span>
          </div>
          <PresetGroup
            label="Accent color"
            value={accentIndex === null ? NONE : String(accentIndex)}
            onChange={(v) => setAccent(v === NONE ? null : Number(v))}
            className="flex flex-wrap"
            compact
            options={[
              ...palette.slice(1).map((color, i) => ({
                value: String(i + 1),
                label: hueName(color),
                hint: `${Math.round(color.h)}°`,
                ariaLabel: `${hueName(color)}, hue ${Math.round(color.h)}`,
                visual: chip(color),
              })),
              {
                value: NONE,
                label: 'None',
                hint: 'tint',
                dashed: true,
                ariaLabel: 'None, derive a soft accent from the primary',
                visual: chip(derived),
              },
            ]}
          />
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={onChangeHarmony}>
            Change harmony
          </Button>
          <Button size="sm" variant="ghost" onClick={onChangePrimary}>
            Change primary
          </Button>
        </div>
      </div>
      <ColorRamps tokens={tokens} />
    </>
  );
}
```

`colors-section.tsx` full replacement:

```tsx
'use client';

import { useRef, useState } from 'react';
import {
  HARMONIES,
  accentSourceFor,
  harmonyColors,
  hueName,
  toCss,
  type Mode,
} from '../../lib/color-math';
import { ColorPreview } from '../previews/color-preview';
import { CollapsibleStep, variables } from '../controls';
import { useColors } from '../../providers/color-provider';
import { AccentGroup } from './color-groups/accent-group';
import { HarmonyGroup } from './color-groups/harmony-group';
import { ModeGroup } from './color-groups/mode-group';
import { PrimaryGroup } from './color-groups/primary-group';
import { Strip } from './shared/strip';

type StepId = 'primary' | 'harmony' | 'accent';
const FIRST: StepId[] = ['primary'];

export function ColorsSection() {
  const c = useColors();
  const [open, setOpen] = useState<Set<StepId>>(() => new Set(FIRST));
  const [seenReset, setSeenReset] = useState(c.resetCount);
  const headers = useRef<Partial<Record<StepId, HTMLButtonElement | null>>>({});

  // A provider reset collapses the steps back to the first one.
  if (seenReset !== c.resetCount) {
    setSeenReset(c.resetCount);
    setOpen(new Set(FIRST));
  }

  const toggle = (id: StepId) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const reopen = (id: StepId) => {
    setOpen((prev) => new Set(prev).add(id));
    headers.current[id]?.focus();
  };
  const headerRef = (id: StepId) => (node: HTMLButtonElement | null) => {
    headers.current[id] = node;
  };

  const accentSource = accentSourceFor(c.primary, c.harmony, c.accentIndex);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <ColorPreview tokens={c.tokens.light} dark={false} />
        <ColorPreview tokens={c.tokens.dark} dark />
      </div>
      <ModeGroup
        system={c.system}
        selectedMode={c.mode}
        onSelectMode={(v: Mode) => c.setMode(v)}
      />
      <div role="region" aria-label="Theme colour steps" className="flex flex-col">
        <CollapsibleStep
          number={1}
          title="Primary"
          description="The base colour for buttons, badges and focus."
          open={open.has('primary')}
          onToggle={() => toggle('primary')}
          headerRef={headerRef('primary')}
          summary={
            <span
              aria-hidden="true"
              className="size-5 rounded-sm border border-border bg-primary"
              style={variables({ '--primary': toCss(c.primary) })}
            />
          }
        >
          <PrimaryGroup
            preset={c.preset}
            primary={c.primary}
            customOpen={c.customOpen}
            setPrimary={c.setPrimary}
            setCustomOpen={c.setCustomOpen}
            onChosen={() => setOpen((prev) => new Set(prev).add('harmony'))}
          />
        </CollapsibleStep>
        <CollapsibleStep
          number={2}
          title="Harmony"
          description="How the other colours relate to the base."
          open={open.has('harmony')}
          onToggle={() => toggle('harmony')}
          headerRef={headerRef('harmony')}
          summary={
            <span className="w-12">
              <Strip colors={harmonyColors(c.harmony, c.primary)} />
            </span>
          }
        >
          <HarmonyGroup
            primary={c.primary}
            harmony={c.harmony}
            setHarmony={c.setHarmony}
            onChosen={() => setOpen(new Set<StepId>(['accent']))}
          />
        </CollapsibleStep>
        <CollapsibleStep
          number={3}
          title="Accent"
          description="The soft surface for hover and selection."
          open={open.has('accent')}
          onToggle={() => toggle('accent')}
          headerRef={headerRef('accent')}
          summary={
            <span className="capitalize">
              {accentSource ? hueName(accentSource) : 'Derived'}
            </span>
          }
        >
          <AccentGroup
            primary={c.primary}
            harmony={c.harmony}
            accentIndex={c.accentIndex}
            setAccent={c.setAccent}
            tokens={c.activeTokens}
            onChangeHarmony={() => reopen('harmony')}
            onChangePrimary={() => reopen('primary')}
          />
        </CollapsibleStep>
      </div>
      <span aria-live="polite" className="sr-only">
        {c.message}
      </span>
    </div>
  );
}
```

`HARMONIES` import in `colors-section.tsx` is unused; remove it.

- [ ] **Step 4: Run to verify pass**

Run: `pnpm vitest run components/theme` from `apps/web`.
Expected: all new tests PASS. If the "none harmony" test finds two `None` radios, scope the query with `within(screen.getByRole('radiogroup', { name: 'Harmony' }))`.

---

### Task 5: Repo checks and manual verification

**Files:** none modified except fixes found by the checks, limited to files this plan touched.

- [ ] **Step 1: Run the repo-defined checks (from the repo root)**

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm docs:check
```

Expected: pass for everything this plan touched. Report pre-existing failures separately (the owner's WIP has known `globals.css` design-system findings and a duplicate `ThemeEditor` definition; both are out of scope).

- [ ] **Step 2: Storybook accessibility gate**

```bash
pnpm test:storybook
```

Expected: pass, or report exactly what failed. If no story covers the changed components, report "no story coverage" rather than claiming the gate verified them.

- [ ] **Step 3: Manual check**

Start the app, open `/theme`, and in both light and dark confirm: only step 1 open on load; choosing a primary opens Harmony; choosing a harmony opens Accent only; "None" accent shows a dashed card and updates the preview; Change harmony / Change primary re-open and focus the header; the reset icon collapses back to step 1; Tab and arrow keys move through each swatch group; focus rings are visible.

- [ ] **Step 4: Report**

State what ran and passed, what failed, and what was not run (e.g. the manual check if the sandbox blocked launching the app). Leave all changes uncommitted.
