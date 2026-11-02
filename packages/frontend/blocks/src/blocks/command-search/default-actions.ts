import {
  LayoutDashboardIcon,
  TrendingUpIcon,
  BriefcaseIcon,
  ZapIcon,
  SettingsIcon,
  ClockIcon,
  BookOpenIcon,
  ScrollIcon,
  MessageSquareIcon,
} from 'lucide-react';
import type { CommandSearchGroup } from './types';

export const defaultGroups: CommandSearchGroup[] = [
  {
    heading: 'Suggestions',
    items: [
      { label: 'Dashboard', icon: LayoutDashboardIcon },
      { label: 'Analytics', icon: TrendingUpIcon },
      { label: 'Projects', icon: BriefcaseIcon },
      { label: 'Integrations', icon: ZapIcon },
      { label: 'Settings', icon: SettingsIcon },
    ],
  },
  {
    heading: 'Recent',
    items: [
      { label: 'Q2 Sales Report', icon: ClockIcon, timestamp: '2m ago' },
      { label: 'Sprint Planning', icon: ClockIcon, timestamp: '15m ago' },
      { label: 'API Configuration', icon: ClockIcon, timestamp: '1h ago' },
      { label: 'Team Permissions', icon: ClockIcon, timestamp: '3h ago' },
    ],
  },
  {
    heading: 'Quick Links',
    items: [
      { label: 'Documentation', icon: BookOpenIcon },
      { label: 'Changelog', icon: ScrollIcon },
      { label: 'Community Forum', icon: MessageSquareIcon },
    ],
  },
];
