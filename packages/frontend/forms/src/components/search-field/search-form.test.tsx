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

const input = () => screen.getByLabelText('Search') as HTMLInputElement;

describe('SearchForm', () => {
  it('offers a search field named by a visually hidden label', () => {
    renderForm();

    expect(input().type).toBe('search');
    expect(input().name).toBe('q');
    expect(input().getAttribute('placeholder')).toBe('Search…');
    expect(screen.getByText('Search').className).toContain('sr-only');
  });

  it('gives each form its own input id', () => {
    render(
      <>
        <SearchForm label="Notes" />
        <SearchForm label="People" />
      </>,
    );

    expect(screen.getByLabelText('Notes').id).not.toBe(
      screen.getByLabelText('People').id,
    );
  });

  it('takes a chosen input id and label', () => {
    renderForm({ inputId: 'site-search', label: 'Search notes' });

    expect(screen.getByLabelText('Search notes').id).toBe('site-search');
  });

  it('renders the field in an input group', () => {
    renderForm();

    expect(input().closest('[data-slot="input-group"]')).not.toBeNull();
    expect(input().closest('[data-slot="field"]')).not.toBeNull();
  });

  it('accepts typing and a starting query', () => {
    renderForm({ defaultValue: 'gar' });
    expect(input().value).toBe('gar');

    fireEvent.change(input(), { target: { value: 'routing' } });
    expect(input().value).toBe('routing');
  });

  it('is a search landmark', () => {
    renderForm();

    expect(screen.getByRole('search')).toBeTruthy();
  });

  it('hands the trimmed query to onSearch on submit', () => {
    const onSearch = vi.fn();
    renderForm({ onSearch });
    fireEvent.change(input(), { target: { value: '  garden  ' } });
    fireEvent.submit(screen.getByRole('search'));

    expect(onSearch).toHaveBeenCalledWith('garden');
  });

  it('still searches when onSubmit prevents the default', () => {
    const onSearch = vi.fn();
    renderForm({
      onSearch,
      onSubmit: (event: React.FormEvent) => event.preventDefault(),
    });
    fireEvent.submit(screen.getByRole('search'));

    expect(onSearch).toHaveBeenCalledWith('');
  });

  it('forwards form props such as onSubmit', () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    renderForm({ onSubmit });
    fireEvent.submit(screen.getByRole('search'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('stops the page reloading when there is nothing to submit to', () => {
    renderForm();
    const event = new Event('submit', { bubbles: true, cancelable: true });
    screen.getByRole('search').dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it('leaves a form with an action to submit natively', () => {
    renderForm({ action: '/search' });
    const event = new Event('submit', { bubbles: true, cancelable: true });
    screen.getByRole('search').dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });
});
