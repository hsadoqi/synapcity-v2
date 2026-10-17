import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import RootShell from './root-shell';

// No `nextjs.appDirectory`: the app-router mock in @storybook/nextjs-vite 10.6 does not
// provide the layout cache node that next 16.4's useRouter reads, so every story crashed.
const meta: Meta<typeof RootShell> = {
  title: 'Blocks/RootShell',
  component: RootShell,
  parameters: {
    layout: 'fullscreen',
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
    userId: 'user-123',
  },
};

export const LoggedOut: Story = {
  args: {
    children: <div>Main content goes here</div>,
    userId: null,
  },
};
