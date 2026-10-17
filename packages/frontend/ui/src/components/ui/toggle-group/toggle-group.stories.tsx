import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon } from 'lucide-react';

import {
  ToggleGroup,
  ToggleGroupItem,
} from '@synapcity/frontend-ui/core/toggle-group';

const meta: Meta<typeof ToggleGroup> = {
  title: 'Components/ToggleGroup',
  component: ToggleGroup,
  tags: ['autodocs'],
  args: { 'aria-label': 'Text alignment', defaultValue: ['left'] },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeftIcon aria-hidden />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenterIcon aria-hidden />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRightIcon aria-hidden />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export default meta;
type Story = StoryObj<typeof ToggleGroup>;

export const Default: Story = {};

export const Outline: Story = { args: { variant: 'outline', spacing: 0 } };

export const Vertical: Story = { args: { orientation: 'vertical' } };

export const Multiple: Story = {
  args: { multiple: true, defaultValue: ['left', 'right'] },
};
