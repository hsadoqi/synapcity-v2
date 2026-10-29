import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { simulateTick } from '@synapcity/dev-fixtures/prototype-workspace';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';
import { expect, userEvent, within } from 'storybook/test';

import { memoryDashboardStorage } from '../../../testing';
import { SEED_NOW, SEED_OWNER, seededWorkspace } from '../../../testing';
import { DashboardStoreProvider } from '../../store';
import { DashboardWorkspace } from './dashboard-workspace';
import { WorkspaceLayout } from './dashboard-workspace';
import { DashboardWorkspaceSkeleton } from './dashboard-workspace-skeleton';

const DASH = 'story-dashboard';

/** In-memory storage holding the prototype's sample dashboard, so stories never touch saved data. */
function seededStorage() {
  const { composition, records } = seededWorkspace();
  return memoryDashboardStorage(SEED_OWNER, {
    [`synapcity.dashboard.${SEED_OWNER}.${DASH}.v1`]:
      JSON.stringify(composition),
    [`synapcity.records.${SEED_OWNER}.v1`]: JSON.stringify(records),
  });
}

const meta: Meta<typeof DashboardWorkspace> = {
  title: 'Dashboards/Workspace',
  component: DashboardWorkspace,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="flex h-screen flex-col">
        <Story />
      </div>
    ),
  ],
  args: {
    dashboardId: DASH,
    ownerId: SEED_OWNER,
    now: () => SEED_NOW,
    breakpoint: 'lg',
  },
};

export default meta;
type Story = StoryObj<typeof DashboardWorkspace>;

export const Seeded: Story = {
  render: (args) => <DashboardWorkspace {...args} storage={seededStorage()} />,
};

export const Editing: Story = {
  render: (args) => <DashboardWorkspace {...args} storage={seededStorage()} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = await canvas.findByRole('button', { name: 'Edit layout' });
    await userEvent.click(toggle);
    await expect(
      canvas.getByRole('region', { name: 'Add to dashboard' }),
    ).toBeVisible();
  },
};

export const Tablet: Story = {
  args: { breakpoint: 'md' },
  render: (args) => <DashboardWorkspace {...args} storage={seededStorage()} />,
};

export const Empty: Story = {
  render: (args) => (
    <DashboardWorkspace
      {...args}
      storage={memoryDashboardStorage(SEED_OWNER)}
    />
  ),
};

export const Loading: Story = { render: () => <DashboardWorkspaceSkeleton /> };

/** The sample metrics and goal tick like live data, through `simulateTick` from dev-fixtures. */
export const LiveData: Story = {
  render: () => {
    const { composition, records, simulations } = seededWorkspace();
    return (
      <TooltipProvider>
        <DashboardStoreProvider
          init={{ composition, records, ownerId: SEED_OWNER, breakpoint: 'lg' }}
          onStore={(store) => {
            const id = setInterval(() => {
              store.setState({
                records: simulateTick(
                  store.getState().records,
                  simulations,
                  Date.now(),
                ),
              });
            }, 1500);
            return () => clearInterval(id);
          }}
        >
          <WorkspaceLayout />
        </DashboardStoreProvider>
      </TooltipProvider>
    );
  },
};

const LINK_ITEMS = [
  {
    id: 'space-1',
    kind: 'space' as const,
    name: 'Research',
    icon: 'folder',
    href: '/home/spaces/space-1',
    pinnedAt: '2026-10-20T09:00:00Z',
    lastViewedAt: '2026-10-28T09:00:00Z',
  },
  {
    id: 'dash-2',
    kind: 'dashboard' as const,
    name: 'Weekly review',
    icon: 'layout-dashboard',
    href: '/home/dashboards/dash-2',
    pinnedAt: null,
    lastViewedAt: '2026-10-27T09:00:00Z',
  },
];

/** A storage that behaves like the server adapter: revisioned, one outcome per save. */
function revisionedStorage(
  outcome: (
    base: number,
  ) => Awaited<
    ReturnType<import('../../../contracts').DashboardStorage['saveComposition']>
  >,
) {
  return {
    load: async () => ({ composition: null, records: null, revision: 0 }),
    saveComposition: async (_id: string, _c: unknown, base: number) =>
      outcome(base),
    saveRecords: async () => {},
  };
}

const serverArgs = {
  items: LINK_ITEMS,
  widgetTypes: ['pinned', 'last-opened', 'spaces'] as const,
  persistsStatus: false,
};

/** An empty dashboard on the server adapter, with Add a widget. */
export const EmptyEditable: Story = {
  args: serverArgs,
  render: (args) => (
    <DashboardWorkspace
      {...args}
      storage={revisionedStorage((base) => ({ ok: true, revision: base + 1 }))}
    />
  ),
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole('button', {
        name: 'Add a widget',
      }),
    ).toBeVisible();
  },
};

/** Add a widget, and the save is confirmed. */
export const AddedAndSaved: Story = {
  args: serverArgs,
  render: (args) => (
    <DashboardWorkspace
      {...args}
      storage={revisionedStorage((base) => ({ ok: true, revision: base + 1 }))}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Add a widget' }),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Pinned' }));
    await expect(await canvas.findByText('Research')).toBeVisible();
    await expect(await canvas.findByText('Saved')).toBeVisible();
  },
};

/** The save fails: the status says Not saved and offers Retry. */
export const SaveFailed: Story = {
  args: serverArgs,
  render: (args) => (
    <DashboardWorkspace
      {...args}
      storage={revisionedStorage(() => ({
        ok: false,
        reason: 'failed',
        message: 'Could not save your changes. Try again.',
      }))}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Add a widget' }),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Pinned' }));
    await expect(
      await canvas.findByRole('button', { name: 'Retry' }, { timeout: 4000 }),
    ).toBeVisible();
  },
};

/** The stored dashboard moved on: Changed elsewhere, with Reload. */
export const Conflict: Story = {
  args: serverArgs,
  render: (args) => (
    <DashboardWorkspace
      {...args}
      storage={revisionedStorage(() => ({ ok: false, reason: 'conflict' }))}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Add a widget' }),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Pinned' }));
    await expect(
      await canvas.findByRole('button', { name: 'Reload' }),
    ).toBeVisible();
  },
};
