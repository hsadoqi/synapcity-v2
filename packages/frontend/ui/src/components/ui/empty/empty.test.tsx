import { createRef } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '@synapcity/frontend-ui/core/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@synapcity/frontend-ui/core/empty';

describe('Empty', () => {
  it('composes media, title, description and actions in reading order', () => {
    const onCreate = vi.fn();
    render(
      <Empty role="region" aria-labelledby="empty-title">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <svg aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle id="empty-title">No documents</EmptyTitle>
          <EmptyDescription>Create a document to get started.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={onCreate}>Create document</Button>
        </EmptyContent>
      </Empty>,
    );
    const region = screen.getByRole('region', { name: 'No documents' });
    expect(
      within(region).getByText('Create a document to get started.'),
    ).toBeTruthy();
    expect(
      Array.from(region.querySelectorAll('[data-slot]')).map((element) =>
        element.getAttribute('data-slot'),
      ),
    ).toEqual([
      'empty-header',
      'empty-icon',
      'empty-title',
      'empty-description',
      'empty-content',
      'button',
    ]);
    fireEvent.click(
      within(region).getByRole('button', { name: 'Create document' }),
    );
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it.each([
    [Empty, 'empty'],
    [EmptyHeader, 'empty-header'],
    [EmptyMedia, 'empty-icon'],
    [EmptyTitle, 'empty-title'],
    [EmptyDescription, 'empty-description'],
    [EmptyContent, 'empty-content'],
  ] as const)(
    '%s forwards children, native props, refs and custom layout classes',
    (Component, slot) => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Component
          ref={ref}
          id="part"
          title="Empty state"
          className="mt-2"
          data-testid="part"
          aria-label="Empty state part"
        >
          Content
        </Component>,
      );
      const element = screen.getByTestId('part');
      expect(element.getAttribute('data-slot')).toBe(slot);
      expect(element.textContent).toBe('Content');
      expect(element.id).toBe('part');
      expect(element.title).toBe('Empty state');
      expect(element.getAttribute('aria-label')).toBe('Empty state part');
      expect(element.classList.contains('mt-2')).toBe(true);
      expect(ref.current).toBe(element);
    },
  );

  it('leaves heading semantics to its consumer', () => {
    render(
      <EmptyHeader>
        <EmptyTitle>
          <h2>No results</h2>
        </EmptyTitle>
        <EmptyDescription>Try a different search.</EmptyDescription>
      </EmptyHeader>,
    );
    expect(
      screen.getByRole('heading', { name: 'No results', level: 2 }),
    ).toBeTruthy();
  });

  it('supports description links and rich content', () => {
    render(
      <EmptyDescription>
        Try another filter or <a href="#help">read the guide</a>.
      </EmptyDescription>,
    );
    expect(
      screen.getByRole('link', { name: 'read the guide' }).getAttribute('href'),
    ).toBe('#help');
    expect(
      screen.getByText(/Try another filter/).getAttribute('data-slot'),
    ).toBe('empty-description');
  });

  it('renders a minimal text-only empty state without adding media or actions', () => {
    const { container } = render(
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Nothing here yet</EmptyTitle>
        </EmptyHeader>
      </Empty>,
    );
    expect(screen.getByText('Nothing here yet')).toBeTruthy();
    expect(container.querySelector('[data-slot="empty-icon"]')).toBeNull();
    expect(container.querySelector('[data-slot="empty-content"]')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('merges conflicting layout classes on the container', () => {
    render(<Empty className="p-4 gap-2" data-testid="empty" />);
    const empty = screen.getByTestId('empty');
    expect(empty.classList.contains('p-4')).toBe(true);
    expect(empty.classList.contains('p-6')).toBe(false);
    expect(empty.classList.contains('gap-2')).toBe(true);
    expect(empty.classList.contains('gap-4')).toBe(false);
    expect(empty.classList.contains('min-w-0')).toBe(true);
  });

  it('does not invent live-region behavior for static content', () => {
    const { container } = render(
      <Empty>
        <EmptyTitle>No results</EmptyTitle>
      </Empty>,
    );
    expect(container.querySelector('[role], [aria-live]')).toBeNull();
  });
});

describe('EmptyMedia', () => {
  it('defaults to transparent media without an icon background', () => {
    render(<EmptyMedia data-testid="media">Illustration</EmptyMedia>);
    const media = screen.getByTestId('media');
    expect(media.getAttribute('data-variant')).toBe('default');
    expect(media.classList.contains('bg-transparent')).toBe(true);
    expect(media.classList.contains('bg-muted')).toBe(false);
  });

  it('supports an explicit default variant', () => {
    render(<EmptyMedia variant="default" data-testid="media" />);
    expect(screen.getByTestId('media').getAttribute('data-variant')).toBe(
      'default',
    );
  });

  it('gives icon media its semantic background and size', () => {
    render(
      <EmptyMedia variant="icon" data-testid="media">
        <svg aria-hidden="true" className="size-6" />
      </EmptyMedia>,
    );
    const media = screen.getByTestId('media');
    expect(media.getAttribute('data-variant')).toBe('icon');
    expect(media.classList.contains('bg-muted')).toBe(true);
    expect(media.classList.contains('size-8')).toBe(true);
    expect(media.querySelector('svg')?.classList.contains('size-6')).toBe(true);
    expect(media.hasAttribute('variant')).toBe(false);
  });

  it('merges custom media sizing with variant styles', () => {
    render(
      <EmptyMedia variant="icon" className="size-12" data-testid="media" />,
    );
    const media = screen.getByTestId('media');
    expect(media.classList.contains('size-12')).toBe(true);
    expect(media.classList.contains('size-8')).toBe(false);
    expect(media.classList.contains('bg-muted')).toBe(true);
  });
});
