import { z } from 'zod';

/**
 * Where an answer ends up. A run never just stores answers: each step names the
 * areas of life it feeds, and `routing.ts` turns the answers into one card per area.
 */
export const DESTINATIONS = [
  'Tasks',
  'Schedule',
  'Focus',
  'Journal',
  'Notes',
  'Documents',
  'Dashboard',
  'Habits',
  'Archive',
  'Health',
  'People',
  'Money',
  'Home',
] as const;

export const destinationSchema = z.enum(DESTINATIONS);
export type DestinationId = z.infer<typeof destinationSchema>;

export type DestinationMeta = {
  /** Plain-language description shown in the builder. */
  description: string;
  /** Whether items on the Today board can be ticked off. */
  checkable: boolean;
};

export const DESTINATION_META: Record<DestinationId, DestinationMeta> = {
  Tasks: { description: 'Things to do', checkable: true },
  Schedule: { description: 'Time blocks for today', checkable: false },
  Focus: { description: 'One thing, protected time', checkable: false },
  Journal: { description: 'Your private day entry', checkable: false },
  Notes: { description: 'Things to remember', checkable: false },
  Documents: { description: 'Starter documents', checkable: false },
  Dashboard: { description: 'Dashboards to fill in', checkable: false },
  Habits: { description: 'Habits to log', checkable: true },
  Archive: { description: 'Let go, not deleted', checkable: false },
  Health: { description: 'Body, sleep and food', checkable: true },
  People: { description: 'People to reach out to', checkable: true },
  Money: { description: 'Money to look at', checkable: true },
  Home: { description: 'Home and life admin', checkable: true },
};
