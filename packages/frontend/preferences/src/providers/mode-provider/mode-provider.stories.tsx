import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor, within } from 'storybook/test';

import type { Mode } from '../../types';
import { ModeProvider, useMode } from './mode-provider';

const MODES: ReadonlyArray<Mode> = ['light', 'dark', 'system'];

/*
 * Switching is not exercised here: in Storybook the toolbar owns the mode (see preview.tsx), so a
 * click in a story cannot change it. The unit tests cover switching.
 * Plain buttons: this package never depends on frontend-ui, so the story cannot use ModeToggle. */
const Picker = () => {
  const { mode, nativeMode, setMode } = useMode();
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-xs">
        Choice: <strong>{nativeMode}</strong>, applied: <strong>{mode}</strong>
      </p>
      <div className="flex gap-2">
        {MODES.map((value) => (
          <button
            key={value}
            type="button"
            className="rounded-md border border-border px-2 py-1 text-xs"
            onClick={() => setMode(value)}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
};

const meta: Meta<typeof ModeProvider> = {
  title: 'Providers/ModeProvider',
  component: ModeProvider,
  tags: ['autodocs'],
  args: { attribute: 'class', initialMode: 'system' },
  render: (args) => (
    <ModeProvider {...args}>
      <Picker />
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
