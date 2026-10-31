'use client';

import { Button } from '@synapcity/frontend-ui/core/button';
import { PencilRulerIcon } from 'lucide-react';

import { useDashboardStore } from '../../store';
import { focusPalette } from '../../utils/focus';
import { WidgetsPanel } from '../widgets-panel';

/**
 * The widgets palette as the content of a host's panel destination. It shows
 * the palette and the Arrange list while the store is in edit mode, and
 * otherwise a short explanation with an explicit Edit layout button: showing
 * this place never turns editing on by itself. It holds no state; every
 * operation is a store action, so it can be hidden, shown or remounted without
 * losing anything.
 */
export function DashboardWidgetsDestination() {
  const editMode = useDashboardStore((s) => s.editMode);
  const toggleEditMode = useDashboardStore((s) => s.toggleEditMode);

  if (!editMode) {
    return (
      <div
        data-slot="widgets-destination-idle"
        className="flex flex-col items-start gap-3 p-4"
      >
        <p className="m-0 text-sm text-muted-foreground">
          Choose Edit layout to add widgets and arrange them.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            toggleEditMode();
            // This button is replaced by the palette; keep focus in the panel.
            focusPalette();
          }}
        >
          <PencilRulerIcon aria-hidden="true" />
          Edit layout
        </Button>
      </div>
    );
  }
  return (
    <div data-slot="widgets-destination" className="p-4">
      <WidgetsPanel />
    </div>
  );
}
