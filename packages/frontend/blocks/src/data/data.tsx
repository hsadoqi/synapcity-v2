// Demo data only: every link is `href="#"` and the faces come from the fixed
// set of photo ids this registry already ships, so nothing here reaches a real

import {
  LayoutDashboardIcon,
  InboxIcon,
  RocketIcon,
  BarChart3Icon,
  FileTextIcon,
  LayersIcon,
} from 'lucide-react';
import { Workspace, NavItem, Deployment } from '../types';

// person, a real route or an invented endpoint.
export const WORKSPACES: Workspace[] = [
  {
    id: 'reui-labs',
    name: 'ReUI Labs',
    plan: 'Pro',
    initials: 'RL',
    avatar:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=96&h=96&dpr=2&q=80',
  },
  {
    id: 'acme',
    name: 'Acme Robotics',
    plan: 'Team',
    initials: 'AR',
    avatar:
      'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=96&h=96&dpr=2&q=80',
  },
  {
    id: 'personal',
    name: 'Personal',
    plan: 'Free',
    initials: 'PS',
    avatar:
      'https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?w=96&h=96&dpr=2&q=80',
  },
];

// Icons live in the data as JSX nodes with a STATIC name per library. That
// shape is what `shadcn add` rewrites to whichever icon package the installer
// uses, so a computed or interpolated prop value would leave it nothing to
// rewrite and the row would render an empty box.
export const NAV: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <LayoutDashboardIcon aria-hidden="true" />,
  },
  {
    id: 'inbox',
    label: 'Inbox',
    badge: 12,
    icon: <InboxIcon aria-hidden="true" />,
  },
  {
    id: 'deployments',
    label: 'Deployments',
    isActive: true,
    icon: <RocketIcon aria-hidden="true" />,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <BarChart3Icon aria-hidden="true" />,
  },
  {
    id: 'logs',
    label: 'Logs',
    badge: 3,
    icon: <FileTextIcon aria-hidden="true" />,
  },
  {
    id: 'storage',
    label: 'Storage',
    icon: <LayersIcon aria-hidden="true" />,
  },
];

export const PROJECTS = [
  { id: 'checkout', name: 'Checkout API' },
  { id: 'design-system', name: 'Design system' },
  { id: 'marketing', name: 'Marketing site' },
  { id: 'edge-cache', name: 'Edge cache' },
];

export const DEPLOYMENTS: Deployment[] = [
  {
    id: 'd-4821',
    title: 'Tighten the webhook retry window',
    branch: 'main',
    time: '12m ago',
  },
  {
    id: 'd-4820',
    title: 'Split the pricing bundle',
    branch: 'release/2.8',
    time: '1h ago',
  },
  {
    id: 'd-4819',
    title: 'Move invoices to the edge cache',
    branch: 'feat/edge',
    time: '3h ago',
    failed: true,
  },
  {
    id: 'd-4818',
    title: 'Add locale fallbacks to search',
    branch: 'main',
    time: 'Yesterday',
  },
];

export const STATS = [
  { id: 'build', label: 'Build time', value: '42s' },
  { id: 'success', label: 'Success rate', value: '99.2%' },
  { id: 'prs', label: 'Open PRs', value: '7' },
];
