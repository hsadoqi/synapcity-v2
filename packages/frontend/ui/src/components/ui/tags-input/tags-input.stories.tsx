import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';

import { Label } from '@synapcity/frontend-ui/core/label';
import { TagsInput } from '@synapcity/frontend-ui/core/tags-input';

const meta: Meta<typeof TagsInput> = {
  title: 'Components/TagsInput',
  component: TagsInput,
  tags: ['autodocs'],
  args: { placeholder: 'Add a topic', onValueChange: fn() },
  render: (args) => (
    <div className="flex max-w-sm flex-col gap-2">
      <Label htmlFor="topics">Topics</Label>
      <TagsInput id="topics" {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof TagsInput>;

export const Default: Story = {};

export const WithTags: Story = {
  args: { defaultValue: ['design', 'research'] },
};

/** Enter adds, a pasted list is split, Backspace removes the last tag. */
export const Keyboard: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Topics' });
    await userEvent.type(input, 'design{Enter}ops,');
    await expect(args.onValueChange).toHaveBeenLastCalledWith([
      'design',
      'ops',
    ]);
    await userEvent.keyboard('{Backspace}');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(['design']);
    await expect(canvas.getByRole('status')).toHaveTextContent('Removed ops');
  },
};

export const Limited: Story = {
  args: { defaultValue: ['one', 'two'], maxTags: 3, maxLength: 12 },
};

export const Invalid: Story = {
  args: { 'aria-invalid': true, defaultValue: ['x'] },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: ['locked'] },
};

/** Controlled by its owner, as a form field would be. */
export const Controlled: Story = {
  args: { value: ['alpha'] },
  render: function Render(args) {
    const [{ value = [] }, updateArgs] = useArgs<{ value: string[] }>();
    return (
      <div className="flex max-w-sm flex-col gap-2">
        <Label htmlFor="controlled">Topics</Label>
        <TagsInput
          {...args}
          id="controlled"
          value={value}
          onValueChange={(next) => {
            updateArgs({ value: next });
            args.onValueChange?.(next);
          }}
        />
        <p className="text-xs text-muted-foreground">
          {value.join(' · ') || 'None'}
        </p>
      </div>
    );
  },
};
