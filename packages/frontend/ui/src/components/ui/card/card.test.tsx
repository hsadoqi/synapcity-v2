import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@synapcity/frontend-ui/core/card';

describe('Card', () => {
  it('composes every part and marks each with its slot', () => {
    render(
      <Card data-testid="card">
        <CardHeader data-testid="header">
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
          <CardAction data-testid="action">Edit</CardAction>
        </CardHeader>
        <CardContent data-testid="content">Body</CardContent>
        <CardFooter data-testid="footer">Footer</CardFooter>
      </Card>,
    );

    expect(screen.getByTestId('card').getAttribute('data-slot')).toBe('card');
    expect(screen.getByTestId('header').getAttribute('data-slot')).toBe(
      'card-header',
    );
    expect(screen.getByText('Title').getAttribute('data-slot')).toBe(
      'card-title',
    );
    expect(screen.getByText('Description').getAttribute('data-slot')).toBe(
      'card-description',
    );
    expect(screen.getByTestId('action').getAttribute('data-slot')).toBe(
      'card-action',
    );
    expect(screen.getByTestId('content').getAttribute('data-slot')).toBe(
      'card-content',
    );
    expect(screen.getByTestId('footer').getAttribute('data-slot')).toBe(
      'card-footer',
    );
  });

  it('merges a caller className on the root', () => {
    render(<Card data-testid="card" className="max-w-sm" />);

    expect(screen.getByTestId('card').className).toContain('max-w-sm');
  });

  it('forwards native attributes', () => {
    render(<CardContent id="body" aria-label="Details" />);

    expect(screen.getByLabelText('Details').id).toBe('body');
  });
});
