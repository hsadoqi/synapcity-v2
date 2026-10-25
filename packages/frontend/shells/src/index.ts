// The portable entry. The same names `frontend-ui`'s `blocks` entries exported
// for these components before they moved here.
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
