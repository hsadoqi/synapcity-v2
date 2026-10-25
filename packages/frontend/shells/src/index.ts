// The portable entry. Internal pieces (`RootSidebar`, `RootHeaderContent`) are
// not exported: hosts fill the sidebar through `RootShell`'s `sidebar` prop.
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
export type {
  RootSidebarContent,
  RootSidebarGroup,
  RootSidebarItem,
} from './components/sidebar-shell/root-sidebar';
export {
  ShellLink,
  ShellNavigationProvider,
  type ShellLinkComponent,
  type ShellNavigation,
} from './providers/shell-navigation';
export { ContextSwitcher } from './components/context-switcher';
export { SearchForm } from './components/search-form';
