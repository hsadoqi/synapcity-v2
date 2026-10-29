import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SearchForm } from '.';
import { SidebarProvider } from '@synapcity/frontend-ui/core/sidebar';

const renderForm = (props = {}) =>
  render(
    <SidebarProvider>
      <SearchForm {...props} />
    </SidebarProvider>,
  );

describe('SearchForm', () => {
  it('offers a search field named by a visually hidden label', () => {
    renderForm();
    const input = screen.getByLabelText('Search');

    expect(input.id).toBe('search');
    expect(input.getAttribute('placeholder')).toBe('Search…');
    expect(screen.getByText('Search').className).toContain('sr-only');
  });

  it('marks the field as the sidebar input', () => {
    renderForm();

    expect(screen.getByLabelText('Search').getAttribute('data-slot')).toBe(
      'sidebar-input',
    );
  });

  it('accepts typing', () => {
    renderForm();
    fireEvent.change(screen.getByLabelText('Search'), {
      target: { value: 'routing' },
    });

    expect((screen.getByLabelText('Search') as HTMLInputElement).value).toBe(
      'routing',
    );
  });

  it('is a search landmark', () => {
    renderForm();

    expect(screen.getByRole('search')).toBeTruthy();
  });

  it('hands the trimmed query to onSearch on submit', () => {
    const onSearch = vi.fn();
    renderForm({ onSearch });
    fireEvent.change(screen.getByLabelText('Search'), {
      target: { value: '  garden  ' },
    });
    fireEvent.submit(screen.getByRole('search'));

    expect(onSearch).toHaveBeenCalledWith('garden');
  });

  it('forwards form props such as onSubmit', () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const { container } = renderForm({ onSubmit });
    fireEvent.submit(container.querySelector('form')!);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
