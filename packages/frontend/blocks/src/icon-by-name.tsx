import { createElement } from 'react';
import {
  BookOpenIcon,
  FileTextIcon,
  FlaskConicalIcon,
  FolderIcon,
  GaugeIcon,
  HeartPulseIcon,
  HouseIcon,
  LayoutDashboardIcon,
  LineChartIcon,
  NotebookPenIcon,
  PenLineIcon,
  RocketIcon,
  ScrollTextIcon,
  type LucideIcon,
} from 'lucide-react';

/*
 * Records store an icon as a lucide name in kebab-case. Importing lucide's
 * whole name map would ship every icon, so the names the shell can show are
 * listed here and anything else falls back to a folder.
 */
const ICONS: Record<string, LucideIcon> = {
  'book-open': BookOpenIcon,
  'chart-line': LineChartIcon,
  'file-text': FileTextIcon,
  'flask-conical': FlaskConicalIcon,
  gauge: GaugeIcon,
  'heart-pulse': HeartPulseIcon,
  house: HouseIcon,
  'layout-dashboard': LayoutDashboardIcon,
  'notebook-pen': NotebookPenIcon,
  'pen-line': PenLineIcon,
  rocket: RocketIcon,
  'scroll-text': ScrollTextIcon,
};

function iconByName(name: string | undefined): LucideIcon {
  return (name && ICONS[name]) || FolderIcon;
}

/** Renders a record's icon by name; `createElement` keeps the lookup out of render-time component creation. */
export function NamedIcon({
  name,
  ...props
}: { name: string | undefined } & React.ComponentProps<'svg'>) {
  return createElement(iconByName(name), props);
}
