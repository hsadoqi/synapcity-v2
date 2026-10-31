import { render, screen } from '@testing-library/react';
import { FileText, Share2 } from 'lucide-react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';

import { ResourceFrame, ResourceHeader } from '.';

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const renderFrame = (props: Partial<Parameters<typeof ResourceFrame>[0]>) =>
  render(
    <TooltipProvider>
      <ResourceFrame label="Garden plans" {...props}>
        <p>Body text</p>
      </ResourceFrame>
    </TooltipProvider>,
  );

describe('ResourceFrame', () => {
  it('names the frame and its scrolling body after the resource', () => {
    renderFrame({});
    expect(screen.getByRole('region', { name: 'Garden plans' })).toBeTruthy();
    const body = screen.getByRole('group', { name: 'Garden plans contents' });
    expect(body.tabIndex).toBe(0);
    expect(body.textContent).toBe('Body text');
  });

  it('leaves scrolling to content that scrolls itself', () => {
    renderFrame({ scroll: false });
    expect(screen.queryByRole('group')).toBeNull();
    expect(screen.getByText('Body text')).toBeTruthy();
  });

  it('has no contextual panel without destinations', () => {
    renderFrame({});
    expect(screen.queryByRole('toolbar', { name: 'Contextual panel' })).toBe(
      null,
    );
  });

  it('mounts the contextual panel with the destinations it is given', () => {
    renderFrame({
      destinations: [
        { id: 'related', label: 'Related', icon: FileText, content: 'R' },
      ],
    });
    expect(
      screen.getByRole('toolbar', { name: 'Contextual panel' }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Related' })).toBeTruthy();
  });
});

describe('ResourceHeader', () => {
  it('makes the title the page heading, with a decorative icon', () => {
    render(
      <ResourceHeader
        title="Garden plans"
        icon={<FileText data-testid="icon" />}
      />,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Garden plans' }),
    ).toBeTruthy();
    expect(
      screen.getByTestId('icon').parentElement!.getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it('offers its actions through the shared toolbar', () => {
    const onSelect = vi.fn();
    render(
      <ResourceHeader
        title="Garden plans"
        actions={[{ label: 'Share', icon: <Share2 />, onSelect }]}
      />,
    );
    screen.getByRole('button', { name: 'Share' }).click();
    expect(onSelect).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'More actions' })).toBeTruthy();
  });

  it('shows no toolbar without actions', () => {
    render(<ResourceHeader title="Garden plans" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
