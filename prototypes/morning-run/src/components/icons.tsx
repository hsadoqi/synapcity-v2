import {
  Archive,
  ArrowLeftRight,
  Bed,
  BookOpen,
  Brain,
  CalendarDays,
  Check,
  Coffee,
  Dumbbell,
  FileText,
  Flag,
  Flame,
  Heart,
  House,
  Inbox,
  LayoutDashboard,
  Leaf,
  MessageSquare,
  Moon,
  NotebookPen,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Sun,
  Target,
  Undo2,
  Users,
  Wallet,
  Wind,
  Zap,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';

import type { DestinationId } from '@/lib/runs/destinations';
import type { IconName } from '@/lib/runs/schema';

const ICONS: Record<IconName, LucideIcon> = {
  sun: Sun,
  moon: Moon,
  wind: Wind,
  zap: Zap,
  heart: Heart,
  flag: Flag,
  target: Target,
  book: BookOpen,
  check: Check,
  calendar: CalendarDays,
  doc: FileText,
  dashboard: LayoutDashboard,
  flame: Flame,
  archive: Archive,
  note: NotebookPen,
  back: Undo2,
  inbox: Inbox,
  plus: Plus,
  swap: ArrowLeftRight,
  chat: MessageSquare,
  brain: Brain,
  body: Dumbbell,
  people: Users,
  wallet: Wallet,
  home: House,
  bed: Bed,
  sparkles: Sparkles,
  leaf: Leaf,
  coffee: Coffee,
  pencil: Pencil,
  star: Star,
};

const DESTINATION_ICONS: Record<DestinationId, LucideIcon> = {
  Tasks: Check,
  Schedule: CalendarDays,
  Focus: Target,
  Journal: BookOpen,
  Notes: NotebookPen,
  Documents: FileText,
  Dashboard: LayoutDashboard,
  Habits: Flame,
  Archive: Archive,
  Health: Dumbbell,
  People: Users,
  Money: Wallet,
  Home: House,
};

export function RunIcon({ name, ...props }: { name: IconName } & LucideProps) {
  const Icon = ICONS[name];
  return <Icon aria-hidden="true" {...props} />;
}

export function DestinationIcon({
  dest,
  ...props
}: { dest: DestinationId } & LucideProps) {
  const Icon = DESTINATION_ICONS[dest];
  return <Icon aria-hidden="true" {...props} />;
}
