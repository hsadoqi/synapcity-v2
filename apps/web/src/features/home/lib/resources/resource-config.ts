import type { LucideIcon } from 'lucide-react';

import type { CollectionLabels } from '@synapcity/frontend-collection';

/**
 * What one resource tells the collection feature about itself. Each resource
 * has its own config file so it can move into its own feature unchanged.
 */
export type ResourceConfig = {
  labels: CollectionLabels;
  icon: LucideIcon;
  emptyCopy: {
    title: string;
    /** When the collection spans everything. */
    global: string;
    /** When the collection is inside one space. */
    space: (spaceName: string) => string;
  };
};
