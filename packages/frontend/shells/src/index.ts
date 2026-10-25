// The portable entry: the names consumers imported from `frontend-ui`'s
// `blocks` entries before these components moved here. Internal pieces
// (`RootSidebar`, `SidebarProviders`, `RootHeaderContent`) are not exported;
// nothing outside the shell used them.
export {
  RootShell,
  AuthenticatedShell,
  PublicShell,
  RootHeader,
  RootFooter,
  RootContent,
} from './components/root-shell';
export type { RootBreadcrumb } from './components/root-shell/root-header';
export {
  GlobalPanelShell,
  GlobalPanelToggle,
} from './components/root-shell/global-panel';
export { SidebarShell } from './components/sidebar-shell';
export { ContextSwitcher } from './components/context-switcher';
export { SearchForm } from './components/search-form';
