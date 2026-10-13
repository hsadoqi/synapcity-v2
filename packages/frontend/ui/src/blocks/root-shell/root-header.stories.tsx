import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { RootHeader } from '@synapcity/frontend-ui/blocks/root-shell';
import { ModeProvider } from '@synapcity/frontend-ui/providers/mode-provider';

const meta: Meta<typeof RootHeader> = {
  title: 'Blocks/RootHeader',
  component: RootHeader,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ModeProvider>
        <Story />
      </ModeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RootHeader>;

export const Default: Story = {
  args: {},
};
