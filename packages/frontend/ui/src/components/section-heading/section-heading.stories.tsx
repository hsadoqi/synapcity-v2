import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Pin } from 'lucide-react';

import { SectionHeading } from '@synapcity/frontend-ui/components/section-heading';

const meta: Meta<typeof SectionHeading> = {
  title: 'Components/SectionHeading',
  component: SectionHeading,
  tags: ['autodocs'],
  args: { children: 'Recent' },
};

export default meta;
type Story = StoryObj<typeof SectionHeading>;

/** A quiet heading for a section of a page. Point `aria-labelledby` at its `id`. */
export const Default: Story = {};

/** With a leading icon, which stays out of the accessible name. */
export const WithIcon: Story = {
  args: { icon: Pin, children: 'Pinned' },
};
