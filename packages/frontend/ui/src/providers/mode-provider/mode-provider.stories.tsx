import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ModeToggle } from '@synapcity/frontend-ui/components/mode-toggle';
import {
  ModeProvider,
  useMode,
} from '@synapcity/frontend-ui/providers/mode-provider';

const Readout = () => {
  const { mode, nativeMode } = useMode();
  return (
    <p className="text-xs">
      Choice: <strong>{nativeMode}</strong>, applied: <strong>{mode}</strong>
    </p>
  );
};

const meta: Meta<typeof ModeProvider> = {
  title: 'Providers/ModeProvider',
  component: ModeProvider,
  tags: ['autodocs'],
  args: { attribute: 'class', initialMode: 'system' },
  render: (args) => (
    <ModeProvider {...args}>
      <div className="flex flex-col items-start gap-3">
        <Readout />
        <ModeToggle variant="outline" />
      </div>
    </ModeProvider>
  ),
};

export default meta;
type Story = StoryObj<typeof ModeProvider>;

export const System: Story = {};

export const Light: Story = { args: { initialMode: 'light' } };

export const Dark: Story = { args: { initialMode: 'dark' } };
