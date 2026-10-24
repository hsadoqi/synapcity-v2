import type { Decorator } from '@storybook/nextjs-vite';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';

import {
  DashboardStoreProvider,
  type DashboardStoreInit,
} from '../frontend/store';
import { SEED_NOW, SEED_OWNER, seededWorkspace } from './seed';

/** A story decorator that serves a store seeded with the prototype's sample dashboard. */
export function withDashboardStore(
  overrides: Partial<DashboardStoreInit> & { editMode?: boolean } = {},
): Decorator {
  const { editMode = false, ...init } = overrides;
  return (Story) => {
    const { composition, records } = seededWorkspace();
    return (
      <TooltipProvider>
        <DashboardStoreProvider
          init={{
            composition,
            records,
            ownerId: SEED_OWNER,
            breakpoint: 'lg',
            now: () => SEED_NOW,
            ...init,
          }}
          onStore={(store) => {
            if (editMode && !store.getState().editMode)
              store.getState().toggleEditMode();
          }}
        >
          <Story />
        </DashboardStoreProvider>
      </TooltipProvider>
    );
  };
}
