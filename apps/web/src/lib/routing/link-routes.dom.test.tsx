import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { render } from '@testing-library/react';
import { createSpaceEntity } from '@synapcity/dev-fixtures';
import type { Space } from '@synapcity/features-spaces/contracts';
import {
  SpaceContent,
  SpacesCollection,
} from '@synapcity/features-spaces/frontend';
import { describe, expect, it } from 'vitest';

import { appSidebar } from '@/components/app-sidebar';

import {
  dashboardPathFor,
  dashboardsPathFor,
  documentPathFor,
  documentsPathFor,
  homePathFor,
  spacesPathFor,
} from './user-paths';

const APP = join(__dirname, '../../app');

/** True when a page in `app/` serves `href`: dynamic segments match anything, route groups are transparent. */
function served(href: string): boolean {
  const segments = href.split('?')[0]!.split('/').filter(Boolean);
  const walk = (dir: string, rest: string[]): boolean => {
    const entries = readdirSync(dir, { withFileTypes: true }).filter((e) =>
      e.isDirectory(),
    );
    if (rest.length === 0) {
      return (
        existsSync(join(dir, 'page.tsx')) ||
        entries
          .filter((e) => /^\(.+\)$/.test(e.name))
          .some((e) => walk(join(dir, e.name), rest))
      );
    }
    const [head, ...tail] = rest;
    return entries.some((e) => {
      if (/^\(.+\)$/.test(e.name)) return walk(join(dir, e.name), rest);
      if (e.name === head || /^\[[^.\]]+\]$/.test(e.name))
        return walk(join(dir, e.name), tail);
      return false;
    });
  };
  return walk(APP, segments);
}

/*
 * Routes ADR-0013 (item 9) decided whose pages arrive with Milestone 8: a
 * document or dashboard at the top level and nested in each Space. A link to
 * one of these is expected to 404 until then; any other unserved link is a bug.
 */
const PENDING = [
  /^\/[^/]+\/home\/(documents|dashboards)\/[^/]+$/,
  /^\/[^/]+\/home\/spaces\/[^/]+\/(documents|dashboards)\/[^/]+$/,
];
const pending = (href: string) => PENDING.some((route) => route.test(href));

const hrefs = (container: HTMLElement) =>
  [...container.querySelectorAll('a[href]')]
    .map((a) => a.getAttribute('href')!)
    .filter((href) => href.startsWith('/'));

const item = <Kind extends 'document' | 'dashboard'>(
  id: string,
  kind: Kind,
) => ({
  id,
  name: id,
  icon: kind === 'document' ? 'file-text' : 'boxes',
  createdAt: '2026-10-04T08:00:00Z',
  updatedAt: '2026-10-05T08:00:00Z',
  kind,
});

describe('links on the Spaces pages', () => {
  const homePath = homePathFor('u1');

  it('reach a page the app serves', () => {
    const { container } = render(
      <SpacesCollection
        spaces={[
          {
            ...createSpaceEntity({ id: 's1' }),
            documentsTotal: 0,
            dashboardsTotal: 0,
          },
        ]}
        homePath={homePath}
        setSpacePinned={async () => ({ ok: true, pinnedAt: null })}
      />,
    );

    const links = hrefs(container);
    expect(links).toContain('/u1/home/spaces/s1');
    expect(links.filter((href) => !served(href))).toEqual([]);
  });

  it('on a Space reach a served page or an item route Milestone 8 builds', () => {
    const space: Space = {
      ...createSpaceEntity({ id: 's1' }),
      kind: 'space',
      documents: [item('d1', 'document')],
      dashboards: [item('b1', 'dashboard')],
      documentsTotal: 1,
      dashboardsTotal: 1,
    };
    const { container } = render(
      <SpaceContent homePath={homePath} space={space} />,
    );

    const links = hrefs(container);
    expect(links).toContain('/u1/home/spaces/s1/documents/d1');
    expect(links.filter((href) => !served(href) && !pending(href))).toEqual([]);
  });

  it('use the same item routes as the Documents and Dashboards pages', () => {
    expect(pending(documentPathFor('u1', 'd1'))).toBe(true);
    expect(pending(dashboardPathFor('u1', 'b1'))).toBe(true);
    expect(served('/u1/home/spaces/s1')).toBe(true);
    expect(served('/u1/home/nowhere')).toBe(false);
  });
});

describe('links in the signed-in sidebar', () => {
  it('reach a page the app serves, in every context', () => {
    const trails = [
      [],
      [{ label: 'Spaces', kind: 'collection' as const }],
      [{ label: 'Documents', kind: 'collection' as const }],
      [{ label: 'Dashboards', kind: 'collection' as const }],
    ];
    const records = {
      spaces: [{ id: 's1', name: 'Writing' }],
      documents: [{ id: 'd1', name: 'Draft' }],
      dashboards: [{ id: 'b1', name: 'Week' }],
    };
    for (const trail of trails) {
      const { groups } = appSidebar('u1', trail, '/u1/home', {
        records,
        onOpenPalette: () => {},
        onSearch: () => {},
        onCreate: () => {},
      });
      const links = groups
        .flatMap((group) => [
          group.href,
          ...(group.items ?? []).map((item) => item.href),
        ])
        .filter((href): href is string => !!href?.startsWith('/'));

      expect(links.length).toBeGreaterThan(0);
      // A record's own page may be one Milestone 8 builds (documents and
      // dashboards); any other unserved link is a bug.
      expect(links.filter((href) => !served(href) && !pending(href))).toEqual(
        [],
      );
    }
  });

  it('offer only served places in the context switcher', () => {
    for (const href of [
      homePathFor('u1'),
      spacesPathFor('u1'),
      documentsPathFor('u1'),
      dashboardsPathFor('u1'),
    ]) {
      expect(served(href), href).toBe(true);
    }
  });
});
