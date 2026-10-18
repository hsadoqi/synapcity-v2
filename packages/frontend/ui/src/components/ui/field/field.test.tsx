import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

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

describe('Field', () => {
  it('is a vertical group by default', () => {
    render(<Field data-testid="field">Body</Field>);
    const field = screen.getByTestId('field');

    expect(field.getAttribute('role')).toBe('group');
    expect(field.getAttribute('data-slot')).toBe('field');
    expect(field.getAttribute('data-orientation')).toBe('vertical');
  });

  it('honours the horizontal orientation', () => {
    render(
      <Field data-testid="field" orientation="horizontal">
        Body
      </Field>,
    );

    expect(screen.getByTestId('field').getAttribute('data-orientation')).toBe(
      'horizontal',
    );
  });

  it('merges a caller className', () => {
    render(
      <Field data-testid="field" className="max-w-sm">
        Body
      </Field>,
    );

    expect(screen.getByTestId('field').className).toContain('max-w-sm');
  });
});

describe('FieldLabel', () => {
  it('names the control it is bound to', () => {
    render(
      <Field>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <input id="email" />
      </Field>,
    );

    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByText('Email').getAttribute('data-slot')).toBe(
      'field-label',
    );
  });
});

describe('FieldTitle / FieldDescription / FieldContent', () => {
  it('carry their slot markers', () => {
    render(
      <Field>
        <FieldContent data-testid="content">
          <FieldTitle>Title</FieldTitle>
          <FieldDescription>Help text</FieldDescription>
        </FieldContent>
      </Field>,
    );

    expect(screen.getByTestId('content').getAttribute('data-slot')).toBe(
      'field-content',
    );
    expect(screen.getByText('Title').getAttribute('data-slot')).toBe(
      'field-label',
    );
    expect(screen.getByText('Help text').getAttribute('data-slot')).toBe(
      'field-description',
    );
  });
});

describe('FieldError', () => {
  it('renders nothing without children or errors', () => {
    const { container } = render(<FieldError />);

    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for an empty errors list', () => {
    const { container } = render(<FieldError errors={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('announces children as an alert', () => {
    render(<FieldError>Required</FieldError>);
    const alert = screen.getByRole('alert');

    expect(alert.textContent).toBe('Required');
    expect(alert.getAttribute('data-slot')).toBe('field-error');
  });

  it('renders a single error message as plain text', () => {
    render(<FieldError errors={[{ message: 'Too short' }]} />);

    expect(screen.getByRole('alert').textContent).toBe('Too short');
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('renders several errors as a list', () => {
    render(
      <FieldError
        errors={[{ message: 'Too short' }, { message: 'Needs a number' }]}
      />,
    );

    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(
      ['Too short', 'Needs a number'],
    );
  });

  it('drops duplicate messages', () => {
    render(
      <FieldError
        errors={[{ message: 'Required' }, { message: 'Required' }]}
      />,
    );

    expect(screen.getByRole('alert').textContent).toBe('Required');
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('ignores undefined entries and empty messages in a list', () => {
    render(
      <FieldError
        errors={[undefined, { message: 'A' }, { message: 'B' }, {}]}
      />,
    );

    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(
      ['A', 'B'],
    );
  });

  it('prefers children over errors', () => {
    render(
      <FieldError errors={[{ message: 'From errors' }]}>
        From children
      </FieldError>,
    );

    expect(screen.getByRole('alert').textContent).toBe('From children');
  });
});

describe('FieldSet / FieldLegend / FieldGroup', () => {
  it('names the fieldset by its legend', () => {
    render(
      <FieldSet>
        <FieldLegend>Profile</FieldLegend>
        <FieldGroup data-testid="group">
          <Field>Body</Field>
        </FieldGroup>
      </FieldSet>,
    );

    expect(screen.getByRole('group', { name: 'Profile' })).toBeTruthy();
    expect(screen.getByTestId('group').getAttribute('data-slot')).toBe(
      'field-group',
    );
  });

  it('defaults the legend variant and honours label', () => {
    const { rerender } = render(
      <fieldset>
        <FieldLegend>Legend</FieldLegend>
      </fieldset>,
    );
    expect(screen.getByText('Legend').getAttribute('data-variant')).toBe(
      'legend',
    );

    rerender(
      <fieldset>
        <FieldLegend variant="label">Legend</FieldLegend>
      </fieldset>,
    );
    expect(screen.getByText('Legend').getAttribute('data-variant')).toBe(
      'label',
    );
  });
});

describe('FieldSeparator', () => {
  it('renders without content', () => {
    render(<FieldSeparator data-testid="sep" />);
    const separator = screen.getByTestId('sep');

    expect(separator.getAttribute('data-slot')).toBe('field-separator');
    expect(
      separator.querySelector('[data-slot="field-separator-content"]'),
    ).toBeNull();
  });

  it('renders its content between the rules', () => {
    render(<FieldSeparator data-testid="sep">or</FieldSeparator>);

    expect(
      screen
        .getByTestId('sep')
        .querySelector('[data-slot="field-separator-content"]')?.textContent,
    ).toBe('or');
  });
});
