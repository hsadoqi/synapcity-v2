import type { WidgetType } from '@synapcity/domain-dashboards';
import {
  ActivityIcon,
  CalendarDaysIcon,
  CalendarIcon,
  FileTextIcon,
  FlameIcon,
  ListChecksIcon,
  RepeatIcon,
  TargetIcon,
  type LucideIcon,
} from 'lucide-react';

/** The add-widget palette: each widget type's label and icon. Palette copy, not a registry. */
export const WIDGET_CATALOG: readonly {
  type: WidgetType;
  label: string;
  Icon: LucideIcon;
}[] = [
  { type: 'stat', label: 'Stat card', Icon: FlameIcon },
  { type: 'tasks', label: 'Task list', Icon: ListChecksIcon },
  { type: 'feed', label: 'Recent activity', Icon: ActivityIcon },
  { type: 'calendar', label: 'Schedule', Icon: CalendarIcon },
  { type: 'agenda', label: 'Agenda', Icon: CalendarDaysIcon },
  { type: 'notes', label: 'Notes', Icon: FileTextIcon },
  { type: 'habit', label: 'Habit tracker', Icon: RepeatIcon },
  { type: 'progress', label: 'Goal tracker', Icon: TargetIcon },
];
