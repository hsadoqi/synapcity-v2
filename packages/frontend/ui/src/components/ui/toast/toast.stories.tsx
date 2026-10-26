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
        options={{
          type: 'success',
          title: 'Profile updated.',
          description: 'Your changes are now available everywhere.',
          timeout: 0,
        }}
      />
      <Trigger
        label="Info"
        options={{
          type: 'info',
          title: 'Link confirmed.',
          description: 'Confirm the other message to finish the change.',
          timeout: 0,
        }}
      />
      <Trigger
        label="Warning"
        options={{
          type: 'warning',
          title: 'Storage almost full.',
          description: 'Remove unused files before uploading more.',
          timeout: 0,
        }}
      />
      <Trigger
        label="Error"
        options={{
          type: 'error',
          title: 'Could not save.',
          description: 'Check your connection and try again.',
          timeout: 0,
          priority: 'high',
        }}
      />
      <Trigger
        label="Loading"
        options={{
          type: 'loading',
          title: 'Uploading…',
          description: 'Keep this page open until the upload finishes.',
          timeout: 0,
        }}
      />
    </>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Trigger
      label="Delete note"
      options={{
        type: 'success',
        title: 'Note moved to trash.',
        description: 'It will be permanently deleted after 30 days.',
        timeout: 0,
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
    await waitFor(() =>
      expect(screen.queryByText('Saved')).not.toBeInTheDocument(),
    );
  },
};
