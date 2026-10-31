import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ShellLink } from './shell-navigation';

const meta: Meta<typeof ShellLink> = {
  title: 'Shells/ShellLink',
  component: ShellLink,
  tags: ['autodocs'],
  args: { href: '#the-destination', children: 'A shell link' },
};

export default meta;
type Story = StoryObj<typeof ShellLink>;

/** With no host provider, a shell link is a plain anchor, so a story needs no router. */
export const PlainAnchor: Story = {};
