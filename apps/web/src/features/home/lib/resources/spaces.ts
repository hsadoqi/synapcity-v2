import { Shapes } from 'lucide-react';

import type { ResourceConfig } from './resource-config';

export const SPACES: ResourceConfig = {
  labels: { plural: 'Spaces', singular: 'space' },
  icon: Shapes,
  emptyCopy: {
    title: 'No spaces yet',
    global:
      'A space is a quiet room for one idea, project, or season. Start with whatever is on your mind today.',
    // Spaces are never listed inside a space.
    space: () => '',
  },
};
