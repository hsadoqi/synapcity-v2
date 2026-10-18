import { LayoutDashboard } from 'lucide-react';

import type { ResourceConfig } from './resource-config';

export const DASHBOARDS: ResourceConfig = {
  labels: { plural: 'Dashboards', singular: 'dashboard' },
  icon: LayoutDashboard,
  emptyCopy: {
    title: 'No dashboards yet',
    global:
      'Dashboards gather the things you check often into one calm view. Start with just one or two.',
    space: (spaceName) =>
      `Pull the parts of ${spaceName} you glance at most into a single, calm view.`,
  },
};
