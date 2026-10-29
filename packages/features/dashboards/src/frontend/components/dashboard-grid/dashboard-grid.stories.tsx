import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  LINK_WIDGET_TYPES,
  createComposition,
  layoutsForWidgets,
  type DashboardComposition,
  type Widget,
} from '@synapcity/domain-dashboards';
import type { Breakpoint } from '@synapcity/domain-grids';
import { emptyRecords } from '@synapcity/domain-prototypes';
import { cn } from '@synapcity/frontend-ui/lib/utils';
import { expect, within } from 'storybook/test';

import type { DashboardLinkItem } from '../../../contracts';
import { withDashboardStore } from '../../../testing';
import { DashboardConfigProvider } from '../../config';
import { DashboardGrid } from './index';

const meta: Meta<typeof DashboardGrid> = {
  title: 'Dashboards/Grid',
  component: DashboardGrid,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof DashboardGrid>;

export const View: Story = { decorators: [withDashboardStore()] };

export const Edit: Story = {
  decorators: [withDashboardStore({ editMode: true })],
};

export const Empty: Story = {
  decorators: [
    withDashboardStore({
      composition: createComposition(),
      records: emptyRecords(),
    }),
  ],
};

/*
 * Widget matrix (S2 audit): every link widget, the types a host page offers,
 * at each breakpoint in light and dark. Each grid sits in a container about
 * the width its breakpoint resolves at, so cards render at a real size.
 */
type ItemRow = [
  string,
  DashboardLinkItem['kind'],
  string | null,
  string | null,
];
const ITEM_ROWS: ItemRow[] = [
  ['Launch plan', 'document', '2026-10-20T00:00:00Z', '2026-10-22T00:00:00Z'],
  [
    'Project status',
    'dashboard',
    '2026-10-13T00:00:00Z',
    '2026-10-23T00:00:00Z',
  ],
  [
    'Essay draft: attention and the long middle of a book',
    'document',
    null,
    '2026-10-21T00:00:00Z',
  ],
  ['Writing', 'space', '2026-10-10T00:00:00Z', null],
  ['Client work', 'space', null, '2026-10-19T00:00:00Z'],
  ['Learning', 'space', null, null],
];
const LINK_ITEMS: DashboardLinkItem[] = ITEM_ROWS.map(
  ([name, kind, pinnedAt, lastViewedAt], index) => ({
    id: `item-${index}`,
    kind,
    name,
    icon: kind === 'space' ? 'folder' : 'file-text',
    href: `/home/items/${index}`,
    pinnedAt,
    lastViewedAt,
  }),
);

function linkComposition(): DashboardComposition {
  const settings = createComposition().settings;
  const widgets: Widget[] = LINK_WIDGET_TYPES.map((type, index) => ({
    id: `matrix-${type}`,
    type: type as 'pinned' | 'last-opened' | 'spaces',
    title: ['Pinned', 'Last opened', 'Spaces'][index] ?? type,
    collapsed: false,
    highlight: 'none',
    status: 'active',
    query: { limit: 6 },
  }));
  return { settings, widgets, layouts: layoutsForWidgets(widgets, settings) };
}

const CONTAINER = { lg: 'max-w-5xl', md: 'max-w-3xl', sm: 'max-w-sm' } as const;

function matrix(breakpoint: Breakpoint, theme: 'light' | 'dark'): Story {
  return {
    globals: { theme },
    decorators: [
      (Story) => (
        <div className={cn('w-full bg-muted p-5', CONTAINER[breakpoint])}>
          <Story />
        </div>
      ),
      (Story) => (
        <DashboardConfigProvider
          items={LINK_ITEMS}
          widgetTypes={LINK_WIDGET_TYPES}
        >
          <Story />
        </DashboardConfigProvider>
      ),
      withDashboardStore({
        composition: linkComposition(),
        records: emptyRecords(),
        breakpoint,
      }),
    ],
    play: async ({ canvasElement }) => {
      await expect(document.documentElement.classList.contains(theme)).toBe(
        true,
      );
      for (const name of ['Pinned', 'Last opened', 'Spaces']) {
        const widget = within(canvasElement).getByRole('region', { name });
        await expect(widget).toBeVisible();
        // No card is wider than its cell.
        await expect(widget.scrollWidth).toBeLessThanOrEqual(
          widget.clientWidth,
        );
      }
    },
  };
}

export const WidgetMatrixDesktopLight = matrix('lg', 'light');
export const WidgetMatrixDesktopDark = matrix('lg', 'dark');
export const WidgetMatrixTabletLight = matrix('md', 'light');
export const WidgetMatrixTabletDark = matrix('md', 'dark');
export const WidgetMatrixMobileLight = matrix('sm', 'light');
export const WidgetMatrixMobileDark = matrix('sm', 'dark');
