import type { RootSidebarGroup } from '../components/sidebar-shell/root-sidebar';

/**
 * Story and test content for the sidebar. Not exported: the host supplies the
 * real sections.
 */
export const sampleSidebarGroups: RootSidebarGroup[] = [
  {
    title: 'Main',
    items: [
      { title: 'Home', href: '/user-1/home', isActive: true },
      { title: 'Inbox', href: '#' },
      { title: 'Settings', href: '/user-1/settings' },
    ],
  },
  {
    title: 'Fitness',
    items: [
      { title: 'Training log', href: '/user-1/home/spaces/fitness/log' },
      { title: 'Meal plan', href: '/user-1/home/spaces/fitness/meals' },
    ],
  },
];
