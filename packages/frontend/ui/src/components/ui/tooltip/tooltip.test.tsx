import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@synapcity/frontend-ui/core/tooltip';

const renderTooltip = (rootProps = {}, contentProps = {}) =>
  render(
    <TooltipProvider>
      <Tooltip {...rootProps}>
        <TooltipTrigger>Trigger</TooltipTrigger>
        <TooltipContent {...contentProps}>Hint</TooltipContent>
      </Tooltip>
    </TooltipProvider>,
  );

describe('Tooltip', () => {
  it('stays closed until the trigger is focused', async () => {
    renderTooltip();
    expect(screen.queryByText('Hint')).toBeNull();

    fireEvent.focus(screen.getByRole('button', { name: 'Trigger' }));
    const hint = await screen.findByText('Hint');

    expect(hint.getAttribute('data-slot')).toBe('tooltip-content');
  });

  it('marks the trigger with its slot', () => {
    renderTooltip();

    expect(
      screen.getByRole('button', { name: 'Trigger' }).getAttribute('data-slot'),
    ).toBe('tooltip-trigger');
  });

  it('opens by default with defaultOpen', async () => {
    renderTooltip({ defaultOpen: true });

    expect(await screen.findByText('Hint')).toBeTruthy();
  });

  it('places the content on the requested side', async () => {
    renderTooltip({ defaultOpen: true }, { side: 'bottom' });
    const hint = await screen.findByText('Hint');

    expect(hint.getAttribute('data-side')).toBe('bottom');
  });

  it('does not open when disabled', () => {
    renderTooltip({ disabled: true });
    fireEvent.focus(screen.getByRole('button', { name: 'Trigger' }));

    expect(screen.queryByText('Hint')).toBeNull();
  });
});
