import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from '@synapcity/frontend-ui/core/input-group';

describe('InputGroup', () => {
  it('marks the group and its control', () => {
    render(
      <InputGroup data-testid="group">
        <InputGroupInput aria-label="Domain" />
      </InputGroup>,
    );

    expect(screen.getByTestId('group').getAttribute('data-slot')).toBe(
      'input-group',
    );
    expect(screen.getByLabelText('Domain').getAttribute('data-slot')).toBe(
      'input-group-control',
    );
  });

  it('gives a textarea control the same slot', () => {
    render(
      <InputGroup>
        <InputGroupTextarea aria-label="Message" />
      </InputGroup>,
    );

    expect(screen.getByLabelText('Message').getAttribute('data-slot')).toBe(
      'input-group-control',
    );
  });

  it('exposes addon alignment, inline-start by default', () => {
    render(
      <InputGroup>
        <InputGroupAddon data-testid="start">
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Domain" />
        <InputGroupAddon data-testid="end" align="inline-end" />
      </InputGroup>,
    );

    expect(screen.getByTestId('start').getAttribute('data-align')).toBe(
      'inline-start',
    );
    expect(screen.getByTestId('end').getAttribute('data-align')).toBe(
      'inline-end',
    );
    expect(screen.getByText('https://').textContent).toBe('https://');
  });

  it('focuses the control when the addon is clicked', () => {
    render(
      <InputGroup>
        <InputGroupAddon data-testid="addon">@</InputGroupAddon>
        <InputGroupInput aria-label="Handle" />
      </InputGroup>,
    );
    fireEvent.click(screen.getByTestId('addon'));

    expect(document.activeElement).toBe(screen.getByLabelText('Handle'));
  });

  it('renders a button that is a plain button, ghost and extra small by default', () => {
    const onClick = vi.fn();
    render(
      <InputGroup>
        <InputGroupInput aria-label="Email" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton onClick={onClick}>Invite</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>,
    );
    const button = screen.getByRole('button', { name: 'Invite' });

    expect(button.getAttribute('type')).toBe('button');
    expect(button.getAttribute('data-size')).toBe('xs');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('accepts typing in the control', () => {
    render(
      <InputGroup>
        <InputGroupInput aria-label="Email" />
      </InputGroup>,
    );
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'a@b.co' },
    });

    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe(
      'a@b.co',
    );
  });
});
