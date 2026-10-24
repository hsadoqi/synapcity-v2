import { describe, expect, it } from 'vitest';

import type { Category, WorkspacePackage } from '../model/index.ts';
import { classifyFile } from './index.ts';

const pkg = (
  category: Category,
  name: string,
  dir: string,
): WorkspacePackage => ({
  name,
  dir,
  category,
  legacy: false,
  dependencies: [],
  exports: {},
  tsconfig: null,
});

const settings = pkg(
  'features',
  '@synapcity/features-settings',
  '/r/packages/features/settings',
);
const records = pkg(
  'domain',
  '@synapcity/domain-records',
  '/r/packages/domain/records',
);
const ui = pkg('frontend', '@synapcity/frontend-ui', '/r/packages/frontend/ui');
const data = pkg('server', '@synapcity/server-data', '/r/packages/server/data');
const fixtures = pkg(
  'dev',
  '@synapcity/dev-fixtures',
  '/r/packages/dev/fixtures',
);
const web = pkg('app', 'web', '/r/apps/web');
const storybook = pkg('app', 'storybook', '/r/apps/storybook');

describe('classifyFile graphs', () => {
  it('reads a feature file graph from its first folder under src', () => {
    expect(
      classifyFile(
        '/r/packages/features/settings/src/frontend/x.tsx',
        settings,
        null,
      ),
    ).toEqual({
      graph: 'feature-frontend',
      production: true,
    });
    expect(
      classifyFile(
        '/r/packages/features/settings/src/contracts/x.ts',
        settings,
        null,
      ).graph,
    ).toBe('feature-contracts');
    expect(
      classifyFile(
        '/r/packages/features/settings/src/server/x.ts',
        settings,
        null,
      ).graph,
    ).toBe('feature-server');
    expect(
      classifyFile(
        '/r/packages/features/settings/src/testing/x.ts',
        settings,
        null,
      ),
    ).toEqual({
      graph: 'testing',
      production: false,
    });
  });

  it('uses the category as the graph of single-runtime packages', () => {
    expect(
      classifyFile('/r/packages/domain/records/src/spaces/x.ts', records, null)
        .graph,
    ).toBe('domain');
    expect(
      classifyFile('/r/packages/frontend/ui/src/next/link.tsx', ui, null).graph,
    ).toBe('frontend');
    expect(
      classifyFile('/r/packages/server/data/src/testing/x.ts', data, null),
    ).toEqual({
      graph: 'testing',
      production: false,
    });
  });

  it('puts every dev package file in the dev graph', () => {
    expect(
      classifyFile('/r/packages/dev/fixtures/src/index.ts', fixtures, null),
    ).toEqual({
      graph: 'dev',
      production: false,
    });
  });

  it('splits app files by their directive', () => {
    expect(classifyFile('/r/apps/web/src/a.tsx', web, 'use client').graph).toBe(
      'app-browser',
    );
    expect(classifyFile('/r/apps/web/src/a.tsx', web, null).graph).toBe(
      'app-backend',
    );
    expect(classifyFile('/r/apps/web/src/a.ts', web, 'use server').graph).toBe(
      'app-backend',
    );
  });
});

describe('classifyFile production', () => {
  it.each([
    '/r/apps/web/src/a.test.ts',
    '/r/apps/web/src/a.dom.test.tsx',
    '/r/packages/frontend/ui/src/button/button.stories.tsx',
    '/r/apps/web/e2e/home.e2e.ts',
    '/r/apps/web/.storybook/main.ts',
    '/r/apps/web/vitest.config.ts',
    '/r/apps/web/postcss.config.mjs',
  ])('treats %s as non-production', (file) => {
    expect(classifyFile(file, web, null).production).toBe(false);
  });

  it('treats every storybook app file as non-production', () => {
    expect(
      classifyFile('/r/apps/storybook/src/x.tsx', storybook, null).production,
    ).toBe(false);
  });

  it('treats ordinary source as production', () => {
    expect(
      classifyFile('/r/apps/web/src/app/page.tsx', web, null).production,
    ).toBe(true);
  });
});
