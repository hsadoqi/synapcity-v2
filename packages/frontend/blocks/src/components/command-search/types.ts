import type { LucideIcon } from 'lucide-react';

export interface CommandSearchItem {
  label: string;
  icon?: LucideIcon;
  timestamp?: string;
  onSelect?: () => void;
}

export interface CommandSearchGroup {
  heading: string;
  items: CommandSearchItem[];
}
