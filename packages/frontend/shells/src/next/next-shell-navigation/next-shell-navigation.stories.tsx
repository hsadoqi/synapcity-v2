import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ShellLink } from '../../providers/shell-navigation';
import { NextShellNavigation } from './next-shell-navigation';

const meta: Meta<typeof NextShellNavigation> = {
  title: 'Shells/NextShellNavigation',
  component: NextShellNavigation,
  tags: ['autodocs'],
  args: {
    children: (
      <ShellLink href="#the-destination">A Next.js shell link</ShellLink>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof NextShellNavigation>;

/** Shell links below the binding render as Next.js links. */
export const Default: Story = {};
