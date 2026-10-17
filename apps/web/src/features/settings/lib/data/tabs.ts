import {
  Palette,
  Globe,
  Bell,
  Database,
  Download,
  User,
  Eye,
} from 'lucide-react';

export default [
  {
    value: 'account',
    label: 'Account',
    icon: User,
    component: () =>
      import('../../components/account-settings').then(
        (mod) => mod.AccountSettings,
      ),
  },
  {
    value: 'theme',
    label: 'Theme',
    icon: Palette,
    component: () =>
      import('../../components/theme-settings').then(
        (mod) => mod.ThemeSettings,
      ),
  },
  {
    value: 'appearance',
    label: 'Display',
    icon: Eye,
    component: () =>
      import('../../components/appearance-settings').then(
        (mod) => mod.AppearanceSettings,
      ),
  },
  {
    value: 'regional',
    label: 'Regional',
    icon: Globe,
    component: () =>
      import('../../components/regional-settings').then(
        (mod) => mod.RegionalSettings,
      ),
  },
  {
    value: 'notifications',
    label: 'Notifications',
    icon: Bell,
    component: () =>
      import('../../components/notification-settings').then(
        (mod) => mod.NotificationSettings,
      ),
  },
  {
    value: 'data-privacy',
    label: 'Data privacy',
    icon: Database,
    component: () =>
      import('../../components/data-privacy-settings').then(
        (mod) => mod.DataPrivacySettings,
      ),
  },
  {
    value: 'import-export',
    label: 'Import / Export',
    icon: Download,
    component: () =>
      import('../../components/import-export-settings').then(
        (mod) => mod.ImportExportSettings,
      ),
  },
];
