import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * Breadcrumb trail ownership (ADR-0017). The primary navigable route owns the
 * trail and publishes at most one: exactly one when it shows a trail, none
 * when it is trail-free. Resource views, panel destinations and drawers never
 * publish. Today's convention is that the route's `page.tsx` renders
 * `SetBreadcrumbs` directly, so this test allows the import only there.
 *
 * Limits, so this is not read as more than it is:
 * - It guards the convention; it is not proof of ownership at run time. It
 *   reads direct imports, so a publisher reached through another module is
 *   not seen, and it cannot tell which page is the primary route.
 * - It is a lexical scan, like `protected-routes.test.ts` and
 *   `architecture.test.ts`. It understands named imports (aliased or not),
 *   namespace imports and re-exports from `@synapcity/frontend-shells`; a
 *   `require()` or dynamic import is not followed.
 * - It reads source text, not the rendered tree. A page with two
 *   `<SetBreadcrumbs>` in different branches counts as two, even if only one
 *   renders: build the items conditionally and render one. A tag inside a
 *   comment counts too.
 * - It scans `apps/web/src` and the `features` and `frontend` packages, where
 *   resource views live. Inside `frontend-shells` the bridge is reached by
 *   relative imports, which this does not read.
 * - The page-only rule is today's convention, not the invariant. A
 *   route-owned component or layout that takes over publication would be
 *   added to `ROUTE_OWNED_PUBLISHERS` in the change that introduces it, with
 *   its reason, and the per-page count below would change with it (its pages
 *   would then publish none), so the guardrail follows the convention instead
 *   of blocking it.
 */

const SRC = dirname(fileURLToPath(import.meta.url));
const APP = join(SRC, 'app');
const GROUP = join(APP, '(protected)');
const PACKAGES = join(SRC, '..', '..', '..', 'packages');

const INVARIANT =
  'ADR-0017: the primary route publishes at most one breadcrumb trail; resource views, panel destinations and drawers never publish one. Today’s convention: the route’s page.tsx renders SetBreadcrumbs directly';

/** Files, relative to `src`, that may publish for a route besides its page. None today. */
const ROUTE_OWNED_PUBLISHERS = new Map<string, string>();

/**
 * Signed-in pages that intentionally show no trail, relative to the
 * `(protected)` group, with the reason. Every other signed-in page publishes
 * exactly one.
 */
const TRAIL_FREE = new Map<string, string>([
  ['[userId]/page.tsx', 'renders nothing; it redirects to the person’s Home'],
  [
    '[userId]/home/page.tsx',
    'Home is the workspace root; the header shows the logo, a link home',
  ],
  [
    '[userId]/settings/page.tsx',
    'Settings sits outside the collections and shows the logo',
  ],
]);

const SHELLS = String.raw`['"]@synapcity/frontend-shells['"]`;

/**
 * The names a module renders `SetBreadcrumbs` under (`SetBreadcrumbs`, an
 * alias, or `Namespace.SetBreadcrumbs`), and whether it re-exports it.
 */
export function publisherBindings(source: string): {
  names: string[];
  reexported: boolean;
} {
  const names: string[] = [];
  const named = new RegExp(
    String.raw`import\s+(?:type\s+)?(?:\w+\s*,\s*)?\{([^}]*)\}\s*from\s*${SHELLS}`,
    'g',
  );
  for (const [, specifiers] of source.matchAll(named)) {
    for (const specifier of specifiers!.split(',')) {
      const match = /^\s*(?:type\s+)?SetBreadcrumbs(?:\s+as\s+(\w+))?\s*$/.exec(
        specifier,
      );
      if (match) names.push(match[1] ?? 'SetBreadcrumbs');
    }
  }
  const namespace = new RegExp(
    String.raw`import\s+\*\s+as\s+(\w+)\s+from\s*${SHELLS}`,
    'g',
  );
  for (const [, alias] of source.matchAll(namespace)) {
    if (new RegExp(String.raw`\b${alias}\.SetBreadcrumbs\b`).test(source)) {
      names.push(`${alias}.SetBreadcrumbs`);
    }
  }
  const reexported = new RegExp(
    String.raw`export\s+(?:\*|\{[^}]*\bSetBreadcrumbs\b[^}]*\})\s*from\s*${SHELLS}`,
  ).test(source);
  return { names, reexported };
}

/** How many times a module renders `SetBreadcrumbs` as JSX. */
export function publishCount(source: string): number {
  return publisherBindings(source).names.reduce((count, name) => {
    const tag = new RegExp(`<${name.replace('.', String.raw`\.`)}\\b`, 'g');
    return count + (source.match(tag)?.length ?? 0);
  }, 0);
}

/** Source modules under `dir`, without tests, stories or generated folders. */
function modulesIn(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return ['node_modules', 'dist', '.next'].includes(entry.name)
        ? []
        : modulesIn(path);
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) return [];
    if (/\.(test|dom\.test|stories)\.tsx?$/.test(entry.name)) return [];
    return [path];
  });
}

const read = (path: string) => readFileSync(path, 'utf8');
const imports = (path: string) => {
  const { names, reexported } = publisherBindings(read(path));
  return names.length > 0 || reexported;
};

describe('reading a module for breadcrumb publishers', () => {
  it('finds a plain, aliased or namespaced import and counts its renders', () => {
    const plain = `import { RootShell, SetBreadcrumbs } from '@synapcity/frontend-shells';\n<SetBreadcrumbs items={[]} />`;
    const aliased = `import { SetBreadcrumbs as Trail } from "@synapcity/frontend-shells";\n<Trail items={a} /><Trail items={b} />`;
    const namespaced = `import * as shells from '@synapcity/frontend-shells';\n<shells.SetBreadcrumbs items={[]} />`;
    expect(publishCount(plain)).toBe(1);
    expect(publishCount(aliased)).toBe(2);
    expect(publishCount(namespaced)).toBe(1);
  });

  it('finds a re-export, and ignores other shell imports and other packages', () => {
    expect(
      publisherBindings(
        `export { SetBreadcrumbs } from '@synapcity/frontend-shells';`,
      ).reexported,
    ).toBe(true);
    expect(
      publisherBindings(
        `import { BreadcrumbRootShell } from '@synapcity/frontend-shells';`,
      ).names,
    ).toEqual([]);
    expect(
      publisherBindings(`import { SetBreadcrumbs } from './elsewhere';`).names,
    ).toEqual([]);
  });
});

describe('breadcrumb trail ownership', () => {
  const pages = modulesIn(GROUP).filter((path) => path.endsWith('/page.tsx'));
  const modules = [
    ...modulesIn(SRC),
    ...modulesIn(join(PACKAGES, 'features')),
    ...modulesIn(join(PACKAGES, 'frontend')),
  ];

  it('finds the signed-in pages and the modules to scan', () => {
    expect(pages.length).toBeGreaterThan(0);
    expect(modules.length).toBeGreaterThan(pages.length);
    // A silent scan would pass every rule below.
    expect(pages.filter(imports).length).toBeGreaterThan(0);
  });

  it('imports SetBreadcrumbs only in signed-in route pages', () => {
    const allowed = new Set([
      ...pages,
      ...[...ROUTE_OWNED_PUBLISHERS.keys()].map((path) => join(SRC, path)),
    ]);
    const outside = modules
      .filter((path) => !allowed.has(path) && imports(path))
      .map((path) => relative(join(SRC, '..', '..', '..'), path));
    expect(
      outside,
      `${INVARIANT}. Publish from the route's page.tsx, or list a route-owned publisher in ROUTE_OWNED_PUBLISHERS with its reason.`,
    ).toEqual([]);
  });

  it.each(pages.map((page) => [relative(GROUP, page), page]))(
    '%s publishes the trail its route requires',
    (name, page) => {
      const count = publishCount(read(page));
      const reason = TRAIL_FREE.get(name);
      if (reason) {
        expect(
          count,
          `${name} is trail-free (${reason}), so it publishes none`,
        ).toBe(0);
      } else {
        expect(
          count,
          `${INVARIANT}. ${name} must render SetBreadcrumbs exactly once, or be listed in TRAIL_FREE with its reason.`,
        ).toBe(1);
      }
    },
  );

  it('keeps the trail-free list and the route-owned publishers to files that exist', () => {
    for (const name of TRAIL_FREE.keys()) {
      expect(existsSync(join(GROUP, name)), name).toBe(true);
    }
    for (const path of ROUTE_OWNED_PUBLISHERS.keys()) {
      expect(existsSync(join(SRC, path)), path).toBe(true);
    }
  });
});
