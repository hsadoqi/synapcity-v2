import { PanelRight } from 'lucide-react';
import type { ContextualPanelDestination } from '@synapcity/frontend-shells';

/**
 * The contextual panel's destinations for a resource view. Until real ones
 * exist (another Document or Dashboard beside the work is the next slice),
 * there is one empty place, so the rail and panel behave as they will without
 * inventing a capability.
 */
export const RESOURCE_PANEL: readonly ContextualPanelDestination[] = [
  {
    id: 'context',
    label: 'Context',
    icon: PanelRight,
    content: (
      <p className="p-4 text-sm text-muted-foreground">
        Nothing here yet. Context for your work will appear here.
      </p>
    ),
  },
];
