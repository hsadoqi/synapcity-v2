import {
  Palette,
  Globe,
  Bell,
  Database,
  Download,
  User,
  Eye,
} from 'lucide-react';

export const settingsTabItems = [
  { value: 'account', label: 'Account', icon: User },
  { value: 'theme', label: 'Theme', icon: Palette },
  { value: 'appearance', label: 'Display', icon: Eye },
  { value: 'regional', label: 'Regional', icon: Globe },
  { value: 'notifications', label: 'Notifications', icon: Bell },
  { value: 'data-privacy', label: 'Data privacy', icon: Database },
  { value: 'import-export', label: 'Import / Export', icon: Download },
] as const;
