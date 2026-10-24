import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@synapcity/frontend-ui/core/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleIcon,
  CollapsibleTrigger,
} from '@synapcity/frontend-ui/core/collapsible';

const meta: Meta<typeof Collapsible> = {
  title: 'Components/Collapsible',
  component: Collapsible,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Collapsible>;

export const Default: Story = {
  render: (args) => (
    <Collapsible {...args} className="flex max-w-sm flex-col gap-2">
      <CollapsibleTrigger
        render={<Button variant="ghost" size="sm" className="self-start" />}
      >
        Advanced settings
        <CollapsibleIcon />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p className="text-sm text-muted-foreground">
          Retention, export format and the audit log live here.
        </p>
      </CollapsibleContent>
    </Collapsible>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Advanced settings' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    // The content fades in; wait for it rather than catching it mid-transition.
    await waitFor(() => expect(canvas.getByText(/Retention/)).toBeVisible());
  },
};

export const OpenByDefault: Story = {
  ...Default,
  args: { defaultOpen: true },
  play: undefined,
};

export const Disabled: Story = {
  ...Default,
  args: { disabled: true },
  play: undefined,
};
