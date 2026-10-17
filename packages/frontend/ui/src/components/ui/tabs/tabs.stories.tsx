import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@synapcity/frontend-ui/core/tabs';

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  args: { defaultValue: 'account' },
  render: (args) => (
    <Tabs {...args}>
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Manage your account details.</TabsContent>
      <TabsContent value="security">Password and sign-in options.</TabsContent>
      <TabsContent value="billing">Plans and invoices.</TabsContent>
    </Tabs>
  ),
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {};

export const Line: Story = {
  render: (args) => (
    <Tabs {...args}>
      <TabsList variant="line">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Manage your account details.</TabsContent>
      <TabsContent value="security">Password and sign-in options.</TabsContent>
      <TabsContent value="billing">Plans and invoices.</TabsContent>
    </Tabs>
  ),
};

export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: (args) => (
    <Tabs {...args} className="w-full">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Manage your account details.</TabsContent>
      <TabsContent value="security">Password and sign-in options.</TabsContent>
      <TabsContent value="billing">Plans and invoices.</TabsContent>
    </Tabs>
  ),
};

export const DisabledTab: Story = {
  render: (args) => (
    <Tabs {...args}>
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="billing" disabled>
          Billing
        </TabsTrigger>
      </TabsList>
      <TabsContent value="account">Manage your account details.</TabsContent>
      <TabsContent value="security">Password and sign-in options.</TabsContent>
      <TabsContent value="billing">Plans and invoices.</TabsContent>
    </Tabs>
  ),
};

/** Selecting a tab swaps the visible panel. */
export const SwitchesPanels: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText('Manage your account details.'),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole('tab', { name: 'Security' }));
    await expect(canvas.getByRole('tab', { name: 'Security' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(
      canvas.getByText('Password and sign-in options.'),
    ).toBeVisible();
  },
};
