'use client';

import type { WidgetType } from '@synapcity/domain-dashboards';
import {
  emptyRecords,
  type PrototypeRecordKind,
  type PrototypeRecords,
} from '@synapcity/domain-prototypes';
import { toCalendarDate } from '@synapcity/frontend-ui/lib/calendar-utils';
import { CalendarPlusIcon } from 'lucide-react';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useNow } from '../../hooks/use-now';
import { useDashboardStore } from '../../store';
import { AgendaBody } from '../../widgets/agenda-body';
import { AgendaEventDialog } from '../../widgets/agenda-body/agenda-event-dialog';
import { WidgetBody } from '../../widgets/widget-body';
import { WidgetShell } from '../../widgets/widget-shell';

/** The record tables each widget type reads; a widget re-renders only when one of these changes. */
const WIDGET_TABLES: Record<WidgetType, readonly PrototypeRecordKind[]> = {
  stat: ['metric'],
  progress: ['goal'],
  habit: ['habit'],
  notes: ['note'],
  tasks: ['project', 'task'],
  calendar: ['event'],
  agenda: ['event'],
  feed: ['activity'],
};

/** Widget types that show the time (today's habit day, this week's events, "4 min ago"). */
const TIME_WIDGETS: ReadonlySet<WidgetType> = new Set([
  'habit',
  'calendar',
  'agenda',
  'feed',
]);

const EMPTY_RECORDS = emptyRecords();

function pickTables(records: PrototypeRecords, type: WidgetType | undefined) {
  const tables: Partial<PrototypeRecords> = {};
  for (const kind of type ? WIDGET_TABLES[type] : []) {
    Object.assign(tables, { [kind]: records[kind] });
  }
  return tables;
}

/**
 * Binds one widget's frame and body to the canvas store. It subscribes only
 * to the record tables its type reads, so a change to other records does not
 * re-render it.
 */
export function ConnectedWidget({ widgetId }: { widgetId: string }) {
  const widget = useDashboardStore((s) =>
    s.composition.widgets.find((w) => w.id === widgetId),
  );
  const settings = useDashboardStore((s) => s.composition.settings);
  const tables = useDashboardStore(
    useShallow((s) => pickTables(s.records, widget?.type)),
  );
  const editMode = useDashboardStore((s) => s.editMode);
  const updateWidget = useDashboardStore((s) => s.updateWidget);
  const duplicateWidget = useDashboardStore((s) => s.duplicateWidget);
  const setWidgetStatus = useDashboardStore((s) => s.setWidgetStatus);
  const removeWidget = useDashboardStore((s) => s.removeWidget);
  const toggleTask = useDashboardStore((s) => s.toggleTask);
  const toggleHabitDay = useDashboardStore((s) => s.toggleHabitDay);
  const updateNoteBody = useDashboardStore((s) => s.updateNoteBody);
  const updateMetricValue = useDashboardStore((s) => s.updateMetricValue);
  const updateGoal = useDashboardStore((s) => s.updateGoal);
  const addTask = useDashboardStore((s) => s.addTask);
  const addEvent = useDashboardStore((s) => s.addEvent);
  const now = useNow(widget && TIME_WIDGETS.has(widget.type) ? 30_000 : null);
  // The agenda's day and Add event dialog, held here so the toolbar action and
  // the dialog share the day on screen. View state, not saved.
  const [adding, setAdding] = useState(false);
  const [agendaDay, setAgendaDay] = useState<string>();

  if (!widget) return null;
  const records = { ...EMPTY_RECORDS, ...tables };
  const isAgenda = widget.type === 'agenda';
  const day = agendaDay ?? toCalendarDate(new Date(now));
  return (
    <>
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
        toolbar={
          isAgenda
            ? {
                actions: [
                  {
                    label: 'Add event',
                    icon: <CalendarPlusIcon />,
                    onSelect: () => setAdding(true),
                  },
                ],
              }
            : undefined
        }
      >
        {isAgenda ? (
          <AgendaBody
            events={records.event}
            now={now}
            day={day}
            onDayChange={setAgendaDay}
          />
        ) : (
          <WidgetBody
            widget={widget}
            records={records}
            now={now}
            actions={{
              toggleTask,
              toggleHabitDay,
              updateNoteBody,
              updateMetricValue,
              updateGoal,
              addTask,
            }}
          />
        )}
      </WidgetShell>
      {isAgenda && (
        <AgendaEventDialog
          open={adding}
          onOpenChange={setAdding}
          day={day}
          onAdd={addEvent}
        />
      )}
    </>
  );
}
