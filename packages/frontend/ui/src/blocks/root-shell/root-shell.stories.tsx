import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import RootShell from '@synapcity/frontend-ui/blocks/root-shell/root-shell';

const meta: Meta<typeof RootShell> = {
  title: 'Blocks/RootShell',
  component: RootShell,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof RootShell>;

export const Default: Story = {
  args: {
    children: <div>Main content goes here</div>,
  },
};

export const WithHeaderActions: Story = {
  args: {
    children: <div>Main content goes here</div>,
    headerActions: <button>Header Action</button>,
  },
};

export const LoggedIn: Story = {
  args: {
    children: <div>Main content goes here</div>,
    account: {
      homeHref: '/user-123/home',
      settingsHref: '/user-123/settings',
    },
  },
};

export const LoggedOut: Story = {
  args: {
    children: <div>Main content goes here</div>,
    account: null,
  },
};
