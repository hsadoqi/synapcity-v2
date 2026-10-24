import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FieldFrame, fieldDescribedBy } from './field-frame';

describe('FieldFrame', () => {
  it('labels the control and gives the description and error the ids it is described by', () => {
    render(
      <FieldFrame
        id="f-name"
        label="Name"
        description="Up to 80 characters."
        error="Enter your name."
      >
        <input
          id="f-name"
          aria-describedby={fieldDescribedBy('f-name', {
            description: true,
            error: true,
          })}
        />
      </FieldFrame>,
    );
    const input = screen.getByLabelText('Name');
    expect(input.getAttribute('aria-describedby')).toBe(
      'f-name-description f-name-error',
    );
    expect(document.getElementById('f-name-description')?.textContent).toBe(
      'Up to 80 characters.',
    );
    expect(document.getElementById('f-name-error')?.textContent).toBe(
      'Enter your name.',
    );
  });

  it('renders no error element and no description element when there is none', () => {
    render(
      <FieldFrame id="f" label="Name">
        <input id="f" />
      </FieldFrame>,
    );
    expect(document.getElementById('f-error')).toBeNull();
    expect(document.getElementById('f-description')).toBeNull();
    expect(fieldDescribedBy('f', {})).toBeUndefined();
  });

  it('marks the field invalid while it has an error', () => {
    const { container } = render(
      <FieldFrame id="f" label="Name" error="Wrong.">
        <input id="f" />
      </FieldFrame>,
    );
    expect(
      container
        .querySelector('[data-slot="field"]')
        ?.getAttribute('data-invalid'),
    ).toBe('true');
  });
});
