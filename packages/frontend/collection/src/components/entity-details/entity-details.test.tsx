import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { regionalDefaults } from '@synapcity/domain-preferences';
import { RegionalProvider } from '@synapcity/frontend-preferences';

import { EntityDetails } from './entity-details';
import type { EntityItem } from '../../types';

const document: EntityItem = {
  id: 'doc-1',
  name: 'Launch plan',
  description: 'Milestones and owners.',
  icon: 'file-text',
  kind: 'document',
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-16T09:30:00.000Z',
};

describe('EntityDetails', () => {
  it('shows the name, description and author', () => {
    render(<EntityDetails entity={document} user={{ name: 'Ada' }} />);

    expect(screen.getByRole('heading', { name: 'Launch plan' })).toBeTruthy();
    expect(screen.getByText('Milestones and owners.')).toBeTruthy();
    expect(screen.getByText('Created by')).toBeTruthy();
    expect(screen.getByText('Ada')).toBeTruthy();
  });

  it("writes when it was created in the person's date order, time format and zone", () => {
    render(
      <RegionalProvider
        regional={{
          ...regionalDefaults,
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24-hour',
          timezone: 'Asia/Tokyo',
        }}
        deviceTimeZone={null}
      >
        <EntityDetails entity={document} />
      </RegionalProvider>,
    );

    const created = screen.getByText(/^1 Oct 2026/, { selector: 'time' });
    expect(created.textContent).toBe('1 Oct 2026, 21:00');
    expect(created.getAttribute('dateTime')).toBe(document.createdAt);
  });

  it('omits the description when there is none', () => {
    render(<EntityDetails entity={{ ...document, description: undefined }} />);

    expect(screen.queryByText('Milestones and owners.')).toBeNull();
  });
});
