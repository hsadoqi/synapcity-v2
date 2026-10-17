import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Choose what reaches you.</CardDescription>
      </CardHeader>
      <CardContent>Content</CardContent>
      <CardFooter>Footer</CardFooter>
    </Card>
  ),
};

/** The page-level form: a real h1 in the larger size. */
export const PageHeading: Story = {
  render: () => (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle as="h1" size="lg">
          Sign in
        </CardTitle>
        <CardDescription>
          Use your email and password, or continue with a provider.
        </CardDescription>
      </CardHeader>
      <CardContent>Form</CardContent>
    </Card>
  ),
};
