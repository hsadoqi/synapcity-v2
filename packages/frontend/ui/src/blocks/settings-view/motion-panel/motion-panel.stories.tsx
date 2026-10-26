import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { MotionPanel } from '@synapcity/frontend-ui/blocks/settings-view';

const meta = {
  title: 'Blocks/SettingsView/MotionPanel',
  component: MotionPanel,
  parameters: { layout: 'centered' },
  args: {
    surface: 'card',
    bordered: false,
    inverted: false,
    sectionLabel: 'Appearance',
    sections: [
      {
        label: 'Images',
        rows: [
          { label: 'Image entrance', value: 'Blur in' },
          { label: 'Scroll effect', value: 'Parallax' },
        ],
      },
      {
        label: 'Motion',
        rows: [
          { label: 'Section animation', value: 'Blur in' },
          { label: 'Animation speed', value: 'Slow' },
        ],
      },
    ],
    stepMs: 340,
  },
} satisfies Meta<typeof MotionPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Surfaces: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <MotionPanel {...args} />
      <MotionPanel {...args} surface="glass" />
    </div>
  ),
};

export const Inverted: Story = { args: { inverted: true } };

export const Bordered: Story = { args: { bordered: true } };

/** The values fill in one at a time; a short step shows the whole panel quickly. */
export const FastFill: Story = { args: { stepMs: 80 } };
