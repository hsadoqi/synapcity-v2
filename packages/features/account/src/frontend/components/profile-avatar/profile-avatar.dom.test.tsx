import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProfileAvatar } from './profile-avatar';

describe('ProfileAvatar', () => {
  it('shows initials while there is no picture', () => {
    render(<ProfileAvatar name="Ada Lovelace" imageUrl={null} />);

    expect(screen.getByText('AL')).toBeTruthy();
    expect(screen.queryByText('Default photo')).toBeNull();
  });

  it('shows the default person icon, named for screen readers, with no name', () => {
    const { container } = render(<ProfileAvatar name={null} imageUrl={null} />);

    expect(screen.getByText('Default photo')).toBeTruthy();
    expect(container.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  });

  it('treats a blank name like no name', () => {
    render(<ProfileAvatar name="   " imageUrl={null} />);

    expect(screen.getByText('Default photo')).toBeTruthy();
  });
});
