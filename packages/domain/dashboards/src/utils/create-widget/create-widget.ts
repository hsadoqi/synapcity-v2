import {
  createId,
  newRecord,
  putRecord,
  type PrototypeRecords,
  type RecordContext,
} from '@synapcity/domain-prototypes';

import type { Widget, WidgetType } from '../../types';

const base = (title: string) => ({
  id: createId('wgt'),
  title,
  collapsed: false,
  highlight: 'none' as const,
  status: 'active' as const,
});

/**
 * Creates a widget of `type` plus the record it shows. Query widgets
 * (calendar, feed) select existing records and create none.
 */
export function createWidget(
  type: WidgetType,
  records: PrototypeRecords,
  ctx: RecordContext,
): { widget: Widget; records: PrototypeRecords } {
  switch (type) {
    case 'stat': {
      const metric = {
        ...newRecord('metric', 'New stat', ctx),
        value: 0,
        unit: 'this week',
        note: '+0 vs last week',
      };
      return {
        widget: {
          ...base('New stat'),
          type,
          source: { kind: 'metric', id: metric.id },
        },
        records: putRecord(records, 'metric', metric),
      };
    }
    case 'progress': {
      const goal = {
        ...newRecord('goal', 'New goal', ctx),
        current: 0,
        target: 10,
        unit: 'done',
      };
      return {
        widget: {
          ...base('New goal'),
          type,
          source: { kind: 'goal', id: goal.id },
        },
        records: putRecord(records, 'goal', goal),
      };
    }
    case 'habit': {
      const habit = {
        ...newRecord('habit', 'New habit', ctx),
        completedDays: [],
      };
      return {
        widget: {
          ...base('New habit'),
          type,
          source: { kind: 'habit', id: habit.id },
        },
        records: putRecord(records, 'habit', habit),
      };
    }
    case 'notes': {
      const note = { ...newRecord('note', 'Notes', ctx), body: '' };
      return {
        widget: {
          ...base('Notes'),
          type,
          source: { kind: 'note', id: note.id },
        },
        records: putRecord(records, 'note', note),
      };
    }
    case 'tasks': {
      const project = newRecord('project', 'Task list', ctx);
      const task = {
        ...newRecord('task', 'New task', ctx),
        projectId: project.id,
        done: false,
        order: 0,
      };
      return {
        widget: {
          ...base('Task list'),
          type,
          source: { kind: 'project', id: project.id },
        },
        records: putRecord(
          putRecord(records, 'project', project),
          'task',
          task,
        ),
      };
    }
    case 'calendar':
      return {
        widget: { ...base('Schedule'), type, query: { range: 'week' } },
        records,
      };
    case 'feed':
      return {
        widget: { ...base('Recent activity'), type, query: { limit: 6 } },
        records,
      };
  }
}
