import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@synapcity/frontend-ui/core/avatar';

describe('Avatar', () => {
  it('marks its slot and defaults to the default size', () => {
    render(
      <Avatar data-testid="avatar">
        <AvatarFallback>HS</AvatarFallback>
      </Avatar>,
    );
    const avatar = screen.getByTestId('avatar');

    expect(avatar.getAttribute('data-slot')).toBe('avatar');
    expect(avatar.getAttribute('data-size')).toBe('default');
  });

  it.each(['sm', 'lg'] as const)('exposes the %s size', (size) => {
    render(
      <Avatar data-testid="avatar" size={size}>
        <AvatarFallback>HS</AvatarFallback>
      </Avatar>,
    );

    expect(screen.getByTestId('avatar').getAttribute('data-size')).toBe(size);
  });

  it('shows the fallback when no image has loaded', () => {
    render(
      <Avatar>
        <AvatarImage src="https://invalid.invalid/a.png" alt="" />
        <AvatarFallback>HS</AvatarFallback>
      </Avatar>,
    );
    const fallback = screen.getByText('HS');

    expect(fallback.getAttribute('data-slot')).toBe('avatar-fallback');
  });

  it('merges a caller className', () => {
    render(
      <Avatar data-testid="avatar" className="size-20">
        <AvatarFallback>HS</AvatarFallback>
      </Avatar>,
    );

    expect(screen.getByTestId('avatar').className).toContain('size-20');
  });

  it('renders a badge, a group and a group count', () => {
    render(
      <AvatarGroup data-testid="group">
        <Avatar>
          <AvatarFallback>A</AvatarFallback>
          <AvatarBadge data-testid="badge" />
        </Avatar>
        <AvatarGroupCount data-testid="count">+2</AvatarGroupCount>
      </AvatarGroup>,
    );

    expect(screen.getByTestId('group').getAttribute('data-slot')).toBe(
      'avatar-group',
    );
    expect(screen.getByTestId('badge').getAttribute('data-slot')).toBe(
      'avatar-badge',
    );
    expect(screen.getByTestId('count').textContent).toBe('+2');
  });
});
