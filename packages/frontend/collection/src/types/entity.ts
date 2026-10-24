export type EntityKind = 'space' | 'document' | 'dashboard';

/**
 * What the entity blocks show of a record: the fields they read and nothing
 * else. Resource features own their full shapes (a Space with what takes part
 * in it lives in `features-spaces`) and pass them here as they are.
 */
export type EntityItem = {
  id: string;
  name: string;
  description?: string;
  icon: string;
  kind: EntityKind;
  createdAt: string;
  updatedAt: string;
  /** Where the item opens. The blocks link it here; without one they fall back to their prefix, or show it as text. */
  href?: string;
};
