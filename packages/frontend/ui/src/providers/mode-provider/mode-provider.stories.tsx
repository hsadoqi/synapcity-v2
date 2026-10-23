import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor, within } from 'storybook/test';

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

/**
 * The page root carries one mode, said one way: the class the tokens read, the color-scheme the
 * browser's own controls read, and what useMode() reports all agree, with no stray data-theme.
 */
export const RootAgreesWithItself: Story = {
  play: async ({ canvasElement }) => {
    const root = document.documentElement;
    await waitFor(() => {
      const mode = root.classList.contains('dark') ? 'dark' : 'light';
      expect(root.hasAttribute('data-theme')).toBe(false);
      expect(root.style.colorScheme).toBe(mode);
      expect(
        within(canvasElement).getByText(mode, {
          selector: 'strong:last-child',
        }),
      ).toBeTruthy();
    });
  },
};
