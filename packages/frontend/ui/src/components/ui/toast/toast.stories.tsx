import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@synapcity/frontend-ui/core/button';

import { Toaster, toast } from '@synapcity/frontend-ui/core/toast';

const meta: Meta<typeof Toaster> = {
  title: 'Components/Toast',
  component: Toaster,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <Toaster>
        <div className="flex min-h-48 flex-wrap items-start gap-2 p-4">
          <Story />
        </div>
      </Toaster>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Toaster>;

const Trigger = ({
  label,
  options,
}: {
  label: string;
  options: Parameters<typeof toast.add>[0];
}) => (
  <Button variant="outline" onClick={() => toast.add(options)}>
    {label}
  </Button>
);

export const Default: Story = {
  render: () => (
    <Trigger
      label="Show toast"
      options={{ title: 'Saved', description: 'Your changes were saved.' }}
    />
  ),
};

export const Types: Story = {
  render: () => (
    <>
      <Trigger
        label="Success"
        options={{ type: 'success', title: 'Profile updated' }}
      />
      <Trigger
        label="Info"
        options={{ type: 'info', title: 'New version available' }}
      />
      <Trigger
        label="Warning"
        options={{ type: 'warning', title: 'Storage almost full' }}
      />
      <Trigger
        label="Error"
        options={{ type: 'error', title: 'Could not save' }}
      />
      <Trigger
        label="Loading"
        options={{ type: 'loading', title: 'Uploading…' }}
      />
    </>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Trigger
      label="Delete note"
      options={{
        title: 'Note deleted',
        actionProps: { children: 'Undo' },
      }}
    />
  ),
};

/** A toast appears when added and its close button dismisses it. */
export const Dismisses: Story = {
  render: () => (
    <Trigger label="Show toast" options={{ title: 'Saved', timeout: 0 }} />
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Show toast' }),
    );
    const title = await screen.findByText('Saved');
    await waitFor(() => expect(title).toBeVisible());

    await userEvent.click(screen.getByLabelText('Close toast'));
    // The toast stays mounted through its 500ms exit transition, which can
    // overrun waitFor's 1s default when many story files run in parallel.
    await waitFor(
      () => expect(screen.queryByText('Saved')).not.toBeInTheDocument(),
      { timeout: 4000 },
    );
  },
};
