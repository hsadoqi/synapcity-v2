import type { Decorator } from '@storybook/nextjs-vite';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';
import type { StoreApi } from 'zustand/vanilla';

import {
  DashboardStoreProvider,
  type DashboardStore,
  type DashboardStoreInit,
} from '../frontend/store';
import { ClockProvider } from '../frontend/hooks/use-now';
import { SEED_NOW, SEED_OWNER, seededWorkspace } from './seed';

/** A story decorator that serves a store seeded with the prototype's sample dashboard. */
export function withDashboardStore(
  overrides: Partial<DashboardStoreInit> & {
    editMode?: boolean;
    /** Runs once with the store, to put it in the state a story shows. */
    onReady?: (store: StoreApi<DashboardStore>) => void;
  } = {},
): Decorator {
  const { editMode = false, onReady, ...init } = overrides;
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
            onReady?.(store);
          }}
        >
          <ClockProvider now={() => SEED_NOW}>
            <Story />
          </ClockProvider>
        </DashboardStoreProvider>
      </TooltipProvider>
    );
  };
}
