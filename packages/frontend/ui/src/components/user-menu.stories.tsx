import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Button } from './ui/button';
import { UserMenu } from './user-menu';

const meta: Meta<typeof UserMenu> = {
  title: 'Components/UserMenu',
  component: UserMenu,
  tags: ['autodocs'],
  args: {
    homeHref: '/user-1/home',
    settingsHref: '/user-1/settings',
    name: 'Hanaa Sadoqi',
    email: 'hanaa@example.com',
    imageUrl: null,
  },
};

export default meta;
type Story = StoryObj<typeof UserMenu>;

export const Default: Story = {};

export const WithActions: Story = {
  render: (args) => (
    <UserMenu {...args}>
      <Button variant="ghost" size="sm" label="Sign out">
        Sign out
      </Button>
    </UserMenu>
  ),
};

export const EmailOnly: Story = { args: { name: null } };

export const BrokenImage: Story = {
  args: { imageUrl: 'https://invalid.invalid/avatar.png' },
};
