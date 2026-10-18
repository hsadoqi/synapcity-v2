import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import postcss, { type AtRule, type Declaration, type Root } from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
import { beforeAll, describe, expect, it } from 'vitest';

/*
 * These tests compile the real token CSS and read what a browser would receive. Each guards a
 * defect that built, linted and passed every other check, and was only visible in the output:
 * an @apply typo that silently dropped a rule, a colour named `base` that turned `text-base`
 * into a colour, a theme with no value on a page without a theme class, and font variables an
 * app never defined. The compile uses `source(none)` and an explicit candidate list, so it does
 * not scan the repository and only the classes named below are generated.
 */

const root = fileURLToPath(new URL('..', import.meta.url));
const repo = fileURLToPath(new URL('../../../../', import.meta.url));

const CANDIDATES = [
  'text-2xs',
  'text-xs',
  'text-sm',
  'text-base',
  'text-lg',
  'text-xl',
  'text-2xl',
  'text-3xl',
  'text-4xl',
  'text-5xl',
  'bg-background',
  'text-foreground',
  'font-body',
  'font-ui',
  'font-heading',
  'font-code',
];

const entry = `
@import 'tailwindcss' source(none);
@import './shared-styles.css';
@source inline("${CANDIDATES.join(' ')}");
`;

let css = '';
let tree: Root;

beforeAll(async () => {
  const result = await postcss([tailwindcss({ base: root })]).process(entry, {
    from: join(root, 'compiled-tokens.test.css'),
  });
  css = result.css;
  tree = postcss.parse(css);
});

/** The declarations of every rule whose selector list contains `selector`. */
function declsFor(selector: string, within?: (rule: AtRule | Root) => boolean) {
  const found: Declaration[] = [];
  tree.walkRules((rule) => {
    if (!rule.selectors.some((s) => s === selector)) return;
    if (within && !within(rule.parent as AtRule | Root)) return;
    rule.walkDecls((d) => {
      found.push(d);
    });
  });
  return found;
}

const props = (decls: Declaration[]) => decls.map((d) => d.prop);

describe('the compiled token CSS', () => {
  it('has no at-rule Tailwind did not understand', () => {
    // A typo such as `@min-w-0` (for `@apply min-w-0`) is dropped or passed through without an
    // error, and the class it was meant to define quietly does nothing.
    const allowed = new Set([
      'layer',
      'media',
      'supports',
      'property',
      'keyframes',
      'container',
      'starting-style',
      'charset',
    ]);
    const unknown: string[] = [];
    tree.walkAtRules((rule) => {
      if (!allowed.has(rule.name)) unknown.push(`@${rule.name} ${rule.params}`);
    });
    expect(unknown).toEqual([]);
  });

  it('defines .open-overlay, the stretched-link overlay', () => {
    // Tailwind emits the pseudo-element nested (`.open-overlay { &::after { … } }`); the build
    // flattens it later, so read the nested form.
    let stretched = false;
    tree.walkRules('.open-overlay', (rule) => {
      rule.walkRules(/^&::?after$/, (after) => {
        after.walkDecls('position', (d) => {
          if (d.value === 'absolute') stretched = true;
        });
      });
    });
    expect(stretched).toBe(true);
  });

  it('keeps text-base a font size, not a colour', () => {
    // A colour token named `base` makes `text-base` a text colour, so body text lost the
    // scalable size and every text-base set grey text instead.
    const decls = declsFor('.text-base');
    expect(props(decls)).toContain('font-size');
    expect(props(decls)).not.toContain('color');
  });

  it('derives every size in the type scale from --text-base-size', () => {
    for (const name of [
      'text-2xs',
      'text-xs',
      'text-sm',
      'text-base',
      'text-lg',
      'text-xl',
      'text-2xl',
      'text-3xl',
      'text-4xl',
      'text-5xl',
    ]) {
      const size = declsFor(`.${name}`).find((d) => d.prop === 'font-size');
      expect(size?.value, name).toContain('--text-base-size');
    }
  });

  it('gives a page with no theme class its roles, and a dark fallback', () => {
    // :root is light, so JavaScript off (or before the theme script runs) still has a
    // background and text colour; a system that prefers dark switches it while no class is set.
    const light = declsFor(':root');
    expect(props(light)).toContain('--base-background');
    expect(props(light)).toContain('--base-foreground');
    const dark = declsFor(
      ':root:not(.light):not(.dark)',
      (parent) =>
        parent.type === 'atrule' &&
        (parent as AtRule).params.includes('prefers-color-scheme: dark'),
    );
    expect(props(dark)).toContain('--base-background');
    expect(props(dark)).toContain('--background');
  });

  it('declares every variable it reads without a fallback', () => {
    const declared = new Set<string>();
    tree.walkDecls((d) => {
      if (d.prop.startsWith('--')) declared.add(d.prop);
    });
    tree.walkAtRules('property', (rule) => {
      declared.add(rule.params.trim());
    });
    const missing = new Set<string>();
    tree.walkDecls((d) => {
      for (const m of d.value.matchAll(/var\(\s*(--[\w-]+)\s*([,)])/g)) {
        const [, name, next] = m;
        if (!name || next === ',') continue;
        if (name.startsWith('--tw-')) continue;
        if (!declared.has(name)) missing.add(name);
      }
    });
    expect([...missing]).toEqual([]);
  });

  it('applies the reduced-motion rules the same way for the OS and the setting', () => {
    const inMedia = (parent: AtRule | Root) =>
      parent.type === 'atrule' &&
      (parent as AtRule).params.includes('prefers-reduced-motion');
    const os = declsFor('*', inMedia);
    const setting = declsFor(":root[data-reduced-motion='true'] *");
    for (const decls of [os, setting]) {
      expect(props(decls)).toContain('--tw-enter-translate-x');
      expect(props(decls)).toContain('--tw-exit-scale');
      const transition = decls.find((d) => d.prop === 'transition-property');
      expect(transition?.value).toContain('opacity');
      expect(transition?.value).not.toContain('transform');
    }
  });
});

describe('the appearance preferences', () => {
  const border = (selector: string) =>
    declsFor(selector).find((d) => d.prop === '--border')?.value;

  it('makes "show borders" change the border at normal contrast', () => {
    // The default border is --muted. Setting --border to --muted again left the setting doing
    // nothing unless contrast was low, so it must resolve to something else.
    const normal = border(':root');
    const shown = border(":root[data-borders='true']");
    expect(shown).toBeDefined();
    expect(shown).not.toBe(normal);
  });

  it('lets high contrast beat both, and low contrast soften the border', () => {
    expect(border(":root[data-contrast='high']")).toBe(
      'var(--base-foreground)',
    );
    // The optimizer writes a plain fallback first and the colour-mix inside an @supports block,
    // so read the whole rule, not its first declaration.
    let low = '';
    tree.walkRules(/^:root\[data-contrast='low'\]/, (rule) => {
      low += rule.toString();
    });
    expect(low).toContain('color-mix');
  });

  it('softens the seams (--divider, behind --sidebar-border) with low contrast, and restores them', () => {
    // Otherwise the sidebar's line stays at full strength beside panels that have softened.
    const rule = (re: RegExp) => {
      let text = '';
      tree.walkRules(re, (r) => {
        text += r.toString();
      });
      return text;
    };
    const low = rule(/^:root\[data-contrast='low'\]/);
    expect(low).toMatch(/--divider:[^;]*color-mix/);
    const shown = rule(/^:root\[data-borders='true'\]/);
    expect(shown).toContain('--divider: var(--muted-foreground)');
  });
});

describe('the token source', () => {
  const tokens = join(root, 'tokens');
  const source = readdirSync(tokens)
    .filter((f) => f.endsWith('.css'))
    .map((f) => readFileSync(join(tokens, f), 'utf8'))
    .join('\n');

  it('writes each theme role once, in theme-light or theme-dark', () => {
    // A second hand-written copy (a dark fallback, a .dark block) drifts from the first.
    for (const decl of [
      '--base-background: var(--base-50);',
      '--base-background: var(--base-950);',
      '--base-foreground: var(--base-950);',
      '--base-foreground: var(--base-50);',
      '--primary: var(--primary-400);',
      '--primary: var(--primary-500);',
    ]) {
      expect(source.split(decl).length - 1, decl).toBe(1);
    }
  });
});

describe('the font variables the tokens read', () => {
  const shared = readFileSync(join(root, 'shared-styles.css'), 'utf8');
  const referenced = new Set(
    [...shared.matchAll(/var\(\s*(--font-[\w-]+)/g)]
      .map((m) => m[1])
      .filter((n): n is string => !!n && !n.startsWith('--font-preference')),
  );
  const definedHere = new Set(
    [...shared.matchAll(/^\s*(--font-[\w-]+):/gm)].map((m) => m[1]),
  );
  // What an app has to provide: referenced by the tokens, defined by no token.
  const fromApps = [...referenced].filter((n) => !definedHere.has(n)).sort();

  const loaders: Record<string, string> = {
    web: 'apps/web/src/app/fonts.ts',
    docs: 'apps/docs/src/app/layout.tsx',
    storybook: 'apps/storybook/.storybook/preview.tsx',
  };

  it('are the three the apps are expected to load', () => {
    expect(fromApps).toEqual([
      '--font-geist-mono',
      '--font-geist-sans',
      '--font-inter',
    ]);
  });

  for (const [app, file] of Object.entries(loaders)) {
    it(`are all defined by ${app}`, () => {
      const loader = readFileSync(join(repo, file), 'utf8');
      const defined = [
        ...loader.matchAll(/variable:\s*'(--font-[\w-]+)'/g),
      ].map((m) => m[1]);
      expect(defined).toEqual(expect.arrayContaining(fromApps));
    });
  }
});
