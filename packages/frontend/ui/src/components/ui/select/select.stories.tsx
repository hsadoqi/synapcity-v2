import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@synapcity/frontend-ui/core/select';

const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof Select>;

const Example = ({
  size,
  disabled,
  invalid,
  defaultOpen,
  defaultValue,
}: {
  size?: 'sm' | 'default';
  disabled?: boolean;
  invalid?: boolean;
  defaultOpen?: boolean;
  defaultValue?: string;
}) => (
  <Select
    defaultOpen={defaultOpen}
    defaultValue={defaultValue}
    disabled={disabled}
  >
    <SelectTrigger
      aria-label="Theme"
      aria-invalid={invalid}
      size={size}
      className="w-48"
    >
      <SelectValue placeholder="Choose a theme" />
    </SelectTrigger>
    <SelectContent alignItemWithTrigger={false}>
      <SelectGroup>
        <SelectLabel>Appearance</SelectLabel>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
      </SelectGroup>
      <SelectSeparator />
      <SelectItem value="system">System</SelectItem>
    </SelectContent>
  </Select>
);

export const Default: Story = { render: () => <Example /> };

export const WithValue: Story = {
  render: () => <Example defaultValue="dark" />,
};

export const Small: Story = { render: () => <Example size="sm" /> };

export const Disabled: Story = { render: () => <Example disabled /> };

export const Invalid: Story = { render: () => <Example invalid /> };

export const Open: Story = { render: () => <Example defaultOpen /> };

/** Opening the trigger and choosing an item updates the displayed value. */
export const SelectsAnItem: Story = {
  render: () => <Example />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('combobox', {
      name: 'Theme',
    });

    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole('option', { name: 'Dark' }));

    await expect(trigger).toHaveTextContent(/dark/i);
    // Let the popup finish closing so its focus guards are gone before the
    // a11y check runs on the settled story.
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
  },
};
