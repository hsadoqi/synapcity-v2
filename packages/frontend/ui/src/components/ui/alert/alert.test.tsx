import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@synapcity/frontend-ui/core/alert';

describe('Alert', () => {
  it('is an alert landmark with a slot marker', () => {
    render(<Alert>Saved</Alert>);
    const alert = screen.getByRole('alert');

    expect(alert.getAttribute('data-slot')).toBe('alert');
    expect(alert.textContent).toBe('Saved');
  });

  it('marks its title, description and action parts', () => {
    render(
      <Alert>
        <AlertTitle>Title</AlertTitle>
        <AlertDescription>Description</AlertDescription>
        <AlertAction>Undo</AlertAction>
      </Alert>,
    );

    expect(screen.getByText('Title').getAttribute('data-slot')).toBe(
      'alert-title',
    );
    expect(screen.getByText('Description').getAttribute('data-slot')).toBe(
      'alert-description',
    );
    expect(screen.getByText('Undo').getAttribute('data-slot')).toBe(
      'alert-action',
    );
  });

  it('styles the destructive variant differently from the default', () => {
    const { rerender } = render(<Alert>Message</Alert>);
    const defaultClass = screen.getByRole('alert').className;

    rerender(<Alert variant="destructive">Message</Alert>);
    const destructiveClass = screen.getByRole('alert').className;

    expect(destructiveClass).not.toBe(defaultClass);
    expect(destructiveClass).toContain('text-destructive');
    expect(defaultClass).toContain('text-card-foreground');
  });

  it('merges a caller className without dropping the base styles', () => {
    render(<Alert className="max-w-sm">Message</Alert>);
    const { className } = screen.getByRole('alert');

    expect(className).toContain('max-w-sm');
    expect(className).toContain('rounded-lg');
  });

  it('forwards other attributes and lets role be overridden', () => {
    render(
      <Alert id="notice" role="status">
        Message
      </Alert>,
    );
    const status = screen.getByRole('status');

    expect(status.id).toBe('notice');
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
