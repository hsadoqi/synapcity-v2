import type { Breakpoint } from '@synapcity/domain-grids';
import { render, type RenderResult } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { StoreApi } from 'zustand/vanilla';

import {
  DashboardStoreProvider,
  type DashboardStore,
  type DashboardStoreInit,
} from '../frontend/store';
import { SEED_NOW, SEED_OWNER, seededWorkspace } from './seed';

/** Renders `ui` inside a store seeded with the prototype's sample dashboard. */
export function renderWithStore(
  ui: ReactNode,
  overrides: Partial<DashboardStoreInit> & { breakpoint?: Breakpoint } = {},
): RenderResult & { store: () => StoreApi<DashboardStore> } {
  const { composition, records } = seededWorkspace();
  let store: StoreApi<DashboardStore> | undefined;
  const result = render(
    <DashboardStoreProvider
      init={{
        composition,
        records,
        ownerId: SEED_OWNER,
        breakpoint: 'lg',
        now: () => SEED_NOW,
        ...overrides,
      }}
      onStore={(s) => {
        store = s;
      }}
    >
      {ui}
    </DashboardStoreProvider>,
  );
  return { ...result, store: () => store! };
}
