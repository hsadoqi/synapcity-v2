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

  it('puts an asterisk beside a required label that assistive tech skips', () => {
    render(
      <FieldFrame id="f" label="Name" required>
        <input id="f" />
      </FieldFrame>,
    );

    const label = screen.getByText('Name', { selector: 'label' });
    expect(label.textContent).toBe('Name');
    expect(screen.getByLabelText('Name')).toBeTruthy();
    const marker = label.nextElementSibling;
    expect(marker?.textContent).toBe('*');
    expect(marker?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders the spoken requirement only when given, under the required id', () => {
    const { rerender } = render(
      <FieldFrame id="f" label="Due" requiredHint="Required">
        <button id="f" type="button" />
      </FieldFrame>,
    );
    expect(document.getElementById('f-required')?.textContent).toBe('Required');

    rerender(
      <FieldFrame id="f" label="Due">
        <button id="f" type="button" />
      </FieldFrame>,
    );
    expect(document.getElementById('f-required')).toBeNull();
  });

  it('keeps a live status region in place for a field with an async check', () => {
    const { rerender } = render(
      <FieldFrame id="f" label="Handle" live>
        <input id="f" />
      </FieldFrame>,
    );
    const region = screen.getByRole('status');
    expect(region.textContent).toBe('');

    rerender(
      <FieldFrame id="f" label="Handle" live status="Validating…">
        <input id="f" />
      </FieldFrame>,
    );
    expect(screen.getByRole('status')).toBe(region);
    expect(region.textContent).toBe('Validating…');
  });

  it('renders no status region without live', () => {
    render(
      <FieldFrame id="f" label="Name" status="ignored">
        <input id="f" />
      </FieldFrame>,
    );
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('describes a control by its description, error and spoken requirement, in that order', () => {
    expect(
      fieldDescribedBy('f', {
        description: true,
        error: true,
        requiredHint: true,
      }),
    ).toBe('f-description f-error f-required');
    expect(fieldDescribedBy('f', {})).toBeUndefined();
  });
});
