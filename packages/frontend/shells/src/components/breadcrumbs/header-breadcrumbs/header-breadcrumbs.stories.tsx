import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { HeaderBreadcrumbs } from '.';

/** The path to the current page, as the signed-in header shows it. */
const meta = {
  title: 'Blocks/HeaderBreadcrumbs',
  component: HeaderBreadcrumbs,
  args: {
    items: [
      { label: 'Spaces', href: '/u/home/spaces' },
      { label: 'Garden plans' },
    ],
  },
} satisfies Meta<typeof HeaderBreadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Long: Story = {
  args: {
    items: [
      { label: 'Spaces', href: '/u/home/spaces' },
      { label: 'A space with a very long name', href: '/u/home/spaces/long' },
      { label: 'A document title that keeps going past the edge of the bar' },
    ],
  },
};

export const NoTrail: Story = { args: { items: [] } };
