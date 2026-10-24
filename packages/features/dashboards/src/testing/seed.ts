import { createPrototypeWorkspace } from '@synapcity/dev-fixtures/prototype-workspace';

/** Friday 23 October 2026, 09:00 local: the sample week has past, present and future days. */
export const SEED_NOW = new Date(2026, 9, 23, 9, 0).getTime();

export const SEED_OWNER = '00000000-0000-4000-8000-000000000001';

/** The prototype's sample dashboard and records, as of {@link SEED_NOW}. */
export function seededWorkspace() {
  return createPrototypeWorkspace(SEED_NOW, SEED_OWNER);
}
