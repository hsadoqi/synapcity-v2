import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { createFixtures } from '@synapcity/dev-fixtures';
import { Label } from '@synapcity/frontend-ui/core/label';
import { Textarea } from '@synapcity/frontend-ui/core/textarea';

const fixtures = createFixtures();

const meta: Meta<typeof Textarea> = {
  title: 'Components/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  args: {
    id: 'textarea-story',
    placeholder: 'Write something',
  },
  decorators: [
    (Story) => (
      <div className="flex w-80 flex-col gap-2">
        <Label htmlFor="textarea-story">Notes</Label>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Empty: Story = {};

export const WithContent: Story = {
  args: {
    defaultValue: fixtures.paragraph(),
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: fixtures.paragraph(),
    disabled: true,
  },
};
