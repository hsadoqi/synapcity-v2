import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from '@synapcity/frontend-ui/core/button';

import { MessagePage } from '.';

const meta = {
  title: 'Blocks/MessagePage',
  component: MessagePage,
  parameters: { layout: 'fullscreen' },
  args: {
    title: 'Page not found',
    description: 'The page you were looking for does not exist.',
    children: <Button variant="outline">Go home</Button>,
  },
} satisfies Meta<typeof MessagePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotFound: Story = {};

export const UnexpectedError: Story = {
  args: {
    title: 'Something went wrong',
    description: 'An unexpected error stopped this page from loading.',
    children: <Button>Try again</Button>,
  },
};
