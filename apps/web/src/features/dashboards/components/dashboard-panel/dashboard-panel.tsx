'use client';

import { LayoutGrid } from 'lucide-react';
import { DashboardWidgetsDestination } from '@synapcity/features-dashboards/frontend';
import type { ContextualPanelDestination } from '@synapcity/frontend-shells';

import { RESOURCE_PANEL } from '@/components/resource-panel';

/** The Widgets destination's id: what Edit layout asks the panel to open. */
export const WIDGETS_DESTINATION_ID = 'widgets';

/**
 * The Dashboard page's contextual panel destinations: the widgets palette,
 * then the shared Context place. A fixed list, so the rail never changes with
 * edit mode. The palette's content reads the Dashboard store, so the page
 * renders this beneath the store's provider.
 */
export const DASHBOARD_PANEL: readonly ContextualPanelDestination[] = [
  {
    id: WIDGETS_DESTINATION_ID,
    label: 'Widgets',
    icon: LayoutGrid,
    content: <DashboardWidgetsDestination />,
  },
  ...RESOURCE_PANEL,
];
