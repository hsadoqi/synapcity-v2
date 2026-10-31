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
export {
  GlobalPanelShell,
  GlobalPanelToggle,
} from './components/root-shell/global-panel';
export { SidebarShell } from './components/sidebar-shell';
export {
  ContextualPanelShell,
  useContextualPanel,
  type ContextualPanelDestination,
} from './components/contextual-panel';
export { ResourceFrame, ResourceHeader } from './components/resource-frame';
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
export {
  BreadcrumbProvider,
  useBreadcrumbs,
  BreadcrumbTrailContext,
  type BreadcrumbTrail,
  BreadcrumbMenu,
  type RootBreadcrumb,
  activeContext,
} from './components/breadcrumbs';
export { AuthPageShell } from './components/auth-page-shell';
export { MessagePage } from './components/message-page';
export {
  ContextSwitcher,
  type ContextOption,
} from './components/context-switcher';
export {
  CommandPalette,
  type CommandPaletteGroup,
  type CommandPaletteItem,
} from './components/command-palette';
