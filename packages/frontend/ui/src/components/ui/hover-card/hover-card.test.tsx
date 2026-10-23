import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@synapcity/frontend-ui/core/hover-card';

const renderCard = (rootProps = {}, contentProps = {}) =>
  render(
    <HoverCard {...rootProps}>
      <HoverCardTrigger render={<span />}>Writing</HoverCardTrigger>
      <HoverCardContent {...contentProps}>
        <p>Ideas, drafts, and reference material.</p>
      </HoverCardContent>
    </HoverCard>,
  );

describe('HoverCard', () => {
  it('stays closed until it is hovered', () => {
    renderCard();

    expect(screen.queryByText(/Ideas, drafts/)).toBeNull();
  });

  it('shows its content when open', async () => {
    renderCard({ defaultOpen: true });

    expect(await screen.findByText(/Ideas, drafts/)).toBeTruthy();
  });

  it('marks the trigger and content with their slots', async () => {
    renderCard({ defaultOpen: true });
    const content = (await screen.findByText(/Ideas, drafts/)).closest(
      '[data-slot="hover-card-content"]',
    );

    expect(content).toBeTruthy();
    expect(screen.getByText('Writing').getAttribute('data-slot')).toBe(
      'hover-card-trigger',
    );
  });

  it('places the content on the requested side', async () => {
    renderCard({ defaultOpen: true }, { side: 'left' });
    const content = (await screen.findByText(/Ideas, drafts/)).closest(
      '[data-slot="hover-card-content"]',
    );

    expect(content?.getAttribute('data-side')).toBe('left');
  });
});
