import { settingsTabItems } from './tab-items';

export default settingsTabItems.map((tab) => ({
  ...tab,
  component: () => {
    switch (tab.value) {
      case 'account':
        return Promise.resolve(() => null);
      case 'theme':
        return import('../../components/theme-settings').then(
          (module) => module.ThemeSettings,
        );
      case 'appearance':
        return import('../../components/appearance-settings').then(
          (module) => module.AppearanceSettings,
        );
      case 'regional':
        return import('../../components/regional-settings').then(
          (module) => module.RegionalSettings,
        );
      case 'notifications':
        return import('../../components/notification-settings').then(
          (module) => module.NotificationSettings,
        );
      case 'data-privacy':
        return import('../../components/data-privacy-settings').then(
          (module) => module.DataPrivacySettings,
        );
      case 'import-export':
        return import('../../components/import-export-settings').then(
          (module) => module.ImportExportSettings,
        );
    }
  },
}));
