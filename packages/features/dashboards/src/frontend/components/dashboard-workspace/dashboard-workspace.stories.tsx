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
