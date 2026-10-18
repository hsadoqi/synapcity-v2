import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CircleAlertIcon, InfoIcon } from 'lucide-react';

import { Button } from '@synapcity/frontend-ui/core/button';

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@synapcity/frontend-ui/core/alert';

const meta: Meta<typeof Alert> = {
  title: 'Components/Alert',
  component: Alert,
  tags: ['autodocs'],
  args: { variant: 'default' },
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>
        Your changes are saved as a draft until you publish them.
      </AlertDescription>
    </Alert>
  ),
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {};

export const Destructive: Story = {
  args: { variant: 'destructive' },
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Could not save</AlertTitle>
      <AlertDescription>
        The connection dropped before your changes reached the server.
      </AlertDescription>
    </Alert>
  ),
};

export const WithIcon: Story = {
  render: (args) => (
    <Alert {...args}>
      <InfoIcon aria-hidden />
      <AlertTitle>New version available</AlertTitle>
      <AlertDescription>Reload the page to get the latest.</AlertDescription>
    </Alert>
  ),
};

export const DestructiveWithIcon: Story = {
  args: { variant: 'destructive' },
  render: (args) => (
    <Alert {...args}>
      <CircleAlertIcon aria-hidden />
      <AlertTitle>Payment failed</AlertTitle>
      <AlertDescription>Update your card to keep your plan.</AlertDescription>
    </Alert>
  ),
};

export const WithAction: Story = {
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Session expiring</AlertTitle>
      <AlertDescription>
        You will be signed out in five minutes.
      </AlertDescription>
      <AlertAction>
        <Button size="xs" variant="outline">
          Stay signed in
        </Button>
      </AlertAction>
    </Alert>
  ),
};

export const TitleOnly: Story = {
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Profile updated</AlertTitle>
    </Alert>
  ),
};
