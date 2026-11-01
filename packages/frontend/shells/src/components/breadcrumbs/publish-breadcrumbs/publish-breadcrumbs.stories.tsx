import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { PublishBreadcrumbs } from '.';
import { BreadcrumbProvider } from '../breadcrumb-trail';

const account = { homeHref: '/u/home', settingsHref: '/u/settings' };

/**
 * A page renders `PublishBreadcrumbs` with its trail; it draws nothing itself, and
 * the shell's header shows the trail.
 */
const meta = {
  title: 'Blocks/PublishBreadcrumbs',
  component: PublishBreadcrumbs,
  parameters: { layout: 'fullscreen' },
  args: {
    items: [
      { label: 'Spaces', href: '/u/home/spaces' },
      { label: 'Garden plans' },
    ],
  },
  decorators: [
    (Story) => (
      <BreadcrumbProvider account={account}>
        <Story />
        <p className="p-4">Page content</p>
      </BreadcrumbProvider>
    ),
  ],
} satisfies Meta<typeof PublishBreadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoTrail: Story = { args: { items: [] } };
