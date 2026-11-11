export type {
  AgendaWidget,
  CalendarWidget,
  FeedWidget,
  LastOpenedWidget,
  PinnedWidget,
  SpacesWidget,
  WidgetHighlight,
  WidgetStatus,
} from './widget-base';
export type {
  HabitWidget,
  NotesWidget,
  ProgressWidget,
  StatWidget,
  TasksWidget,
} from './prototype-widgets';
export {
  LINK_WIDGET_TYPES,
  WIDGET_SIZES,
  type LinkSourceKind,
  type Widget,
  type WidgetPatch,
  type WidgetType,
} from './widgets';
export {
  DEFAULT_SETTINGS,
  activeWidgets,
  addWidget,
  applyLayoutChange,
  createComposition,
  dashboardCompositionSchema,
  duplicateComposition,
  duplicateWidget,
  gridLayoutFor,
  layoutsForWidgets,
  moveWidgetInOrder,
  neededLinkKinds,
  removeWidget,
  setWidgetStatus,
  updateSettings,
  updateWidget,
  widgetsWithStatus,
  type DashboardComposition,
  type DashboardSettings,
} from './composition';
export {
  MAX_COMPOSITION_BYTES,
  parsePersistableComposition,
  type PersistableResult,
} from './persistence';
export { createWidget } from './create-widget';
