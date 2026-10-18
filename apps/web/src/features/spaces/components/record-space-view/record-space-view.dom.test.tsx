import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { recordSpaceView } = vi.hoisted(() => ({
  recordSpaceView: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../server/actions/space-state-actions', () => ({
  recordSpaceView,
}));

import { RecordSpaceView } from './record-space-view';

beforeEach(() => vi.clearAllMocks());

describe('RecordSpaceView', () => {
  it('records the view once the page is on screen', () => {
    render(<RecordSpaceView spaceId="space-1" />);

    expect(recordSpaceView).toHaveBeenCalledTimes(1);
    expect(recordSpaceView).toHaveBeenCalledWith('space-1');
  });

  it('renders nothing', () => {
    const { container } = render(<RecordSpaceView spaceId="space-1" />);

    expect(container.firstChild).toBeNull();
  });

  it('records again for a different space', () => {
    const { rerender } = render(<RecordSpaceView spaceId="space-1" />);
    rerender(<RecordSpaceView spaceId="space-2" />);

    expect(recordSpaceView).toHaveBeenLastCalledWith('space-2');
  });
});
