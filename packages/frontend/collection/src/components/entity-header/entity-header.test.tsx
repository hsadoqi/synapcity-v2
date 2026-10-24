import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EntityHeader } from './entity-header';

describe('EntityHeader', () => {
  it('shows the name and description', () => {
    render(<EntityHeader name="Research" description="The workstream." />);

    expect(screen.getByRole('heading', { name: 'Research' })).toBeTruthy();
    expect(screen.getByText('The workstream.')).toBeTruthy();
  });

  it('omits the description when there is none', () => {
    render(<EntityHeader name="Research" />);

    expect(screen.queryByText('The workstream.')).toBeNull();
  });

  it('calls the matching handler for each quick action', () => {
    const onNewDocument = vi.fn();
    const onNewDashboard = vi.fn();
    render(
      <EntityHeader
        name="Research"
        onNewDocument={onNewDocument}
        onNewDashboard={onNewDashboard}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'New document' }));
    expect(onNewDocument).toHaveBeenCalledTimes(1);
    expect(onNewDashboard).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'New dashboard' }));
    expect(onNewDashboard).toHaveBeenCalledTimes(1);
  });

  it('offers a labelled menu trigger for the other actions', () => {
    render(<EntityHeader name="Research" onRename={() => {}} />);

    expect(screen.getByRole('button', { name: 'More actions' })).toBeTruthy();
  });

  it('has no actions menu when no action is given', () => {
    render(<EntityHeader name="Research" />);

    expect(screen.queryByRole('button', { name: 'More actions' })).toBeNull();
  });

  it('offers only the quick actions the caller can carry out', () => {
    render(<EntityHeader name="Research" onNewDocument={() => {}} />);

    expect(screen.getByRole('button', { name: 'New document' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'New dashboard' })).toBeNull();
  });

  it('shows no quick action that would do nothing', () => {
    render(<EntityHeader name="Research" />);

    expect(screen.queryByRole('button', { name: 'New document' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'New dashboard' })).toBeNull();
  });
});
