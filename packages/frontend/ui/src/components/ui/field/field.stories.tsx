import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Input } from '@synapcity/frontend-ui/core/input';
import { Switch } from '@synapcity/frontend-ui/core/switch';

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from '@synapcity/frontend-ui/core/field';

const meta: Meta<typeof Field> = {
  title: 'Components/Field',
  component: Field,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Field>;

export const Default: Story = {
  render: (args) => (
    <Field {...args}>
      <FieldLabel htmlFor="email">Email</FieldLabel>
      <Input id="email" type="email" placeholder="you@example.com" />
      <FieldDescription>We only use this to sign you in.</FieldDescription>
    </Field>
  ),
};

export const WithError: Story = {
  render: (args) => (
    <Field {...args} data-invalid>
      <FieldLabel htmlFor="email-error">Email</FieldLabel>
      <Input id="email-error" type="email" aria-invalid defaultValue="nope" />
      <FieldError>Enter a valid email address.</FieldError>
    </Field>
  ),
};

export const WithMultipleErrors: Story = {
  render: (args) => (
    <Field {...args} data-invalid>
      <FieldLabel htmlFor="password">Password</FieldLabel>
      <Input id="password" type="password" aria-invalid />
      <FieldError
        errors={[
          { message: 'At least 8 characters.' },
          { message: 'Include a number.' },
        ]}
      />
    </Field>
  ),
};

export const Disabled: Story = {
  render: (args) => (
    <Field {...args} data-disabled="true">
      <FieldLabel htmlFor="locked">Workspace ID</FieldLabel>
      <Input id="locked" disabled defaultValue="ws_123" />
      <FieldDescription>Set when the workspace is created.</FieldDescription>
    </Field>
  ),
};

export const Horizontal: Story = {
  args: { orientation: 'horizontal' },
  render: (args) => (
    <Field {...args}>
      <FieldContent>
        <FieldLabel htmlFor="updates">Product updates</FieldLabel>
        <FieldDescription>Occasional news about new features.</FieldDescription>
      </FieldContent>
      <Switch id="updates" />
    </Field>
  ),
};

export const WithTitle: Story = {
  render: (args) => (
    <Field {...args}>
      <FieldTitle>Display name</FieldTitle>
      <Input aria-label="Display name" />
    </Field>
  ),
};

export const FieldSetWithGroup: Story = {
  render: () => (
    <FieldSet>
      <FieldLegend>Profile</FieldLegend>
      <FieldDescription>How you appear to others.</FieldDescription>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="first">First name</FieldLabel>
          <Input id="first" />
        </Field>
        <Field>
          <FieldLabel htmlFor="last">Last name</FieldLabel>
          <Input id="last" />
        </Field>
        <FieldSeparator>or</FieldSeparator>
        <Field>
          <FieldLabel htmlFor="handle">Handle</FieldLabel>
          <Input id="handle" />
        </Field>
      </FieldGroup>
    </FieldSet>
  ),
};

export const LabelLegend: Story = {
  render: () => (
    <FieldSet>
      <FieldLegend variant="label">Notifications</FieldLegend>
      <FieldGroup>
        <Field orientation="horizontal">
          <Switch id="n1" />
          <FieldLabel htmlFor="n1">Email</FieldLabel>
        </Field>
      </FieldGroup>
    </FieldSet>
  ),
};
