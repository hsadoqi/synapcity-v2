import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { setWidgetStatus } from '@synapcity/domain-dashboards';

import { seededWorkspace } from '../../../testing';
import { withDashboardStore } from '../../../testing';
import { WidgetsPanel } from './index';

const { composition } = seededWorkspace();
const [first, second, third] = composition.widgets;
const withHiddenAndArchived = setWidgetStatus(
  setWidgetStatus(
    setWidgetStatus(composition, first!.id, 'hidden'),
    second!.id,
    'archived',
  ),
  third!.id,
  'archived',
);

const meta: Meta<typeof WidgetsPanel> = {
  title: 'Dashboards/WidgetsPanel',
  component: WidgetsPanel,
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WidgetsPanel>;

export const Default: Story = { decorators: [withDashboardStore()] };

export const HiddenAndArchived: Story = {
  decorators: [withDashboardStore({ composition: withHiddenAndArchived })],
};
