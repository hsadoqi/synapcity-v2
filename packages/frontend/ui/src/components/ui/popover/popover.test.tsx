import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '@synapcity/frontend-ui/core/popover';

const renderPopover = (rootProps = {}, contentProps = {}) =>
  render(
    <Popover {...rootProps}>
      <PopoverTrigger>Open</PopoverTrigger>
      <PopoverContent {...contentProps}>
        <PopoverTitle>Preview</PopoverTitle>
        <PopoverDescription>What you have chosen so far.</PopoverDescription>
      </PopoverContent>
    </Popover>,
  );

describe('Popover', () => {
  it('stays closed until the trigger is pressed', async () => {
    renderPopover();
    expect(screen.queryByText('Preview')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(await screen.findByText('Preview')).toBeTruthy();
  });

  it('marks the trigger and content with their slots', async () => {
    renderPopover({ defaultOpen: true });
    const content = (await screen.findByText('Preview')).closest(
      '[data-slot="popover-content"]',
    );

    expect(content).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Open' }).getAttribute('data-slot'),
    ).toBe('popover-trigger');
  });

  it('names the popup from its title', async () => {
    renderPopover({ defaultOpen: true });

    expect(await screen.findByRole('dialog', { name: 'Preview' })).toBeTruthy();
  });

  it('places the content on the requested side', async () => {
    renderPopover({ defaultOpen: true }, { side: 'left' });
    const content = (await screen.findByText('Preview')).closest(
      '[data-slot="popover-content"]',
    );

    expect(content?.getAttribute('data-side')).toBe('left');
  });
});
