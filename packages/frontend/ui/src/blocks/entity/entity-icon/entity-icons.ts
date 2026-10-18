import {
  Archive,
  BookOpen,
  Bookmark,
  Boxes,
  Brain,
  Briefcase,
  Calendar,
  Camera,
  ChartLine,
  ChartPie,
  Clock,
  Code,
  Coffee,
  Compass,
  Dumbbell,
  FileText,
  Flag,
  Folder,
  FolderOpen,
  GraduationCap,
  Heart,
  House,
  Inbox,
  Layers,
  LayoutDashboard,
  Leaf,
  Library,
  Lightbulb,
  ListChecks,
  Map as MapIcon,
  Music,
  Notebook,
  Palette,
  PenLine,
  Plane,
  Quote,
  Sparkles,
  Star,
  Sun,
  Target,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export interface EntityIconOption {
  /** The stored identifier: a Lucide kebab-case name. */
  name: string;
  /** What a picker calls it, and what search matches. */
  label: string;
  Icon: LucideIcon;
}

export interface EntityIconGroup {
  label: string;
  icons: EntityIconOption[];
}

/**
 * The icons an entity can show, grouped as a picker would list them. Fixed and
 * statically imported so icons render on the server with no per-icon request.
 * Every identifier the database defaults to or the seed stores is here; a
 * stored name outside the set renders as the folder.
 */
export const ENTITY_ICON_GROUPS: EntityIconGroup[] = [
  {
    label: 'Places',
    icons: [
      { name: 'folder', label: 'Folder', Icon: Folder },
      { name: 'folder-open', label: 'Open folder', Icon: FolderOpen },
      { name: 'house', label: 'House', Icon: House },
      { name: 'briefcase', label: 'Briefcase', Icon: Briefcase },
      { name: 'boxes', label: 'Boxes', Icon: Boxes },
      { name: 'archive', label: 'Archive', Icon: Archive },
      { name: 'inbox', label: 'Inbox', Icon: Inbox },
      { name: 'layers', label: 'Layers', Icon: Layers },
    ],
  },
  {
    label: 'Writing and knowledge',
    icons: [
      { name: 'file-text', label: 'Document', Icon: FileText },
      { name: 'notebook', label: 'Notebook', Icon: Notebook },
      { name: 'book-open', label: 'Open book', Icon: BookOpen },
      { name: 'pen-line', label: 'Pen', Icon: PenLine },
      { name: 'library', label: 'Library', Icon: Library },
      { name: 'graduation-cap', label: 'Graduation cap', Icon: GraduationCap },
      { name: 'lightbulb', label: 'Lightbulb', Icon: Lightbulb },
      { name: 'brain', label: 'Brain', Icon: Brain },
      { name: 'quote', label: 'Quote', Icon: Quote },
      { name: 'bookmark', label: 'Bookmark', Icon: Bookmark },
    ],
  },
  {
    label: 'Planning',
    icons: [
      { name: 'layout-dashboard', label: 'Dashboard', Icon: LayoutDashboard },
      { name: 'calendar', label: 'Calendar', Icon: Calendar },
      { name: 'list-checks', label: 'Checklist', Icon: ListChecks },
      { name: 'target', label: 'Target', Icon: Target },
      { name: 'flag', label: 'Flag', Icon: Flag },
      { name: 'chart-line', label: 'Line chart', Icon: ChartLine },
      { name: 'chart-pie', label: 'Pie chart', Icon: ChartPie },
      { name: 'clock', label: 'Clock', Icon: Clock },
      { name: 'compass', label: 'Compass', Icon: Compass },
      { name: 'map', label: 'Map', Icon: MapIcon },
    ],
  },
  {
    label: 'Life and work',
    icons: [
      { name: 'heart', label: 'Heart', Icon: Heart },
      { name: 'sparkles', label: 'Sparkles', Icon: Sparkles },
      { name: 'star', label: 'Star', Icon: Star },
      { name: 'coffee', label: 'Coffee', Icon: Coffee },
      { name: 'dumbbell', label: 'Dumbbell', Icon: Dumbbell },
      { name: 'plane', label: 'Plane', Icon: Plane },
      { name: 'music', label: 'Music', Icon: Music },
      { name: 'camera', label: 'Camera', Icon: Camera },
      { name: 'palette', label: 'Palette', Icon: Palette },
      { name: 'code', label: 'Code', Icon: Code },
      { name: 'wallet', label: 'Wallet', Icon: Wallet },
      { name: 'users', label: 'People', Icon: Users },
      { name: 'leaf', label: 'Leaf', Icon: Leaf },
      { name: 'sun', label: 'Sun', Icon: Sun },
    ],
  },
];

// A Map, not an object: a name such as "__proto__" must miss, not hit the prototype.
const byName = new Map<string, EntityIconOption>(
  ENTITY_ICON_GROUPS.flatMap((group) => group.icons).map((option) => [
    option.name,
    option,
  ]),
);

/** The option for a stored identifier, or undefined when it is outside the set. */
export function findEntityIcon(name: string): EntityIconOption | undefined {
  return byName.get(name);
}
