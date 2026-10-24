'use client';

import { useNow } from '../../hooks/use-now';
import { useDashboardStore } from '../../store';
import { WidgetBody } from '../../widgets/widget-body';
import { WidgetShell } from '../../widgets/widget-shell';

/** Binds one widget's frame and body to the canvas store. */
export function ConnectedWidget({ widgetId }: { widgetId: string }) {
  const widget = useDashboardStore((s) =>
    s.composition.widgets.find((w) => w.id === widgetId),
  );
  const settings = useDashboardStore((s) => s.composition.settings);
  const records = useDashboardStore((s) => s.records);
  const editMode = useDashboardStore((s) => s.editMode);
  const updateWidget = useDashboardStore((s) => s.updateWidget);
  const duplicateWidget = useDashboardStore((s) => s.duplicateWidget);
  const setWidgetStatus = useDashboardStore((s) => s.setWidgetStatus);
  const removeWidget = useDashboardStore((s) => s.removeWidget);
  const toggleTask = useDashboardStore((s) => s.toggleTask);
  const toggleHabitDay = useDashboardStore((s) => s.toggleHabitDay);
  const updateNoteBody = useDashboardStore((s) => s.updateNoteBody);
  const now = useNow(30_000);

  if (!widget) return null;
  return (
    <WidgetShell
      widget={widget}
      settings={settings}
      editMode={editMode}
      actions={{
        update: (patch) => updateWidget(widgetId, patch),
        duplicate: () => duplicateWidget(widgetId),
        hide: () => setWidgetStatus(widgetId, 'hidden'),
        archive: () => setWidgetStatus(widgetId, 'archived'),
        remove: () => removeWidget(widgetId),
      }}
    >
      <WidgetBody
        widget={widget}
        records={records}
        now={now}
        actions={{ toggleTask, toggleHabitDay, updateNoteBody }}
      />
    </WidgetShell>
  );
}
