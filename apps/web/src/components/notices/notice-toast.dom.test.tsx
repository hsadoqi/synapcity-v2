import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  search: '',
  replace: vi.fn(),
  push: vi.fn(),
  add: vi.fn(),
  close: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(mocks.search),
  usePathname: () => '/abc/home',
  useRouter: () => ({ replace: mocks.replace, push: mocks.push }),
}));
vi.mock('@synapcity/frontend-ui/core/toast', () => ({
  toast: { add: mocks.add, close: mocks.close },
}));

import { NoticeToast } from './notice-toast';

describe('NoticeToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.search = '';
  });

  it('shows the listed notice as a toast and removes the parameter', () => {
    mocks.search = 'notice=password-updated';
    render(<NoticeToast />);

    expect(mocks.add).toHaveBeenCalledTimes(1);
    expect(mocks.add).toHaveBeenCalledWith({
      id: 'notice-password-updated',
      type: 'success',
      title: 'Password updated.',
      description: undefined,
      timeout: 5000,
      priority: 'low',
      actionProps: undefined,
    });
    expect(mocks.replace).toHaveBeenCalledWith('/abc/home', { scroll: false });
  });

  it('passes on the type, description and duration the list gives', () => {
    mocks.search = 'notice=email-change-step';
    render(<NoticeToast />);

    expect(mocks.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'info',
        title: 'Link confirmed.',
        description: expect.stringMatching(/other address/i),
        timeout: 12000,
        priority: 'low',
      }),
    );
  });

  it('keeps the other parameters when it removes its own', () => {
    mocks.search = 'tab=2&notice=password-updated';
    render(<NoticeToast />);

    expect(mocks.replace).toHaveBeenCalledWith('/abc/home?tab=2', {
      scroll: false,
    });
  });

  it('ignores a key that is not on the list, so a crafted link shows nothing', () => {
    mocks.search = 'notice=<script>alert(1)</script>';
    render(<NoticeToast />);
    mocks.search = 'notice=constructor';
    render(<NoticeToast />);

    expect(mocks.add).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('does nothing without a notice', () => {
    render(<NoticeToast />);

    expect(mocks.add).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('shows it once even if the component renders again before the address updates', () => {
    mocks.search = 'notice=password-updated';
    const { rerender } = render(<NoticeToast />);

    rerender(<NoticeToast />);
    rerender(<NoticeToast />);

    expect(mocks.add).toHaveBeenCalledTimes(1);
  });

  it('shows the same notice again later in the session, after its parameter was removed', () => {
    mocks.search = 'notice=password-updated';
    const { rerender } = render(<NoticeToast />);
    expect(mocks.add).toHaveBeenCalledTimes(1);

    // The address no longer carries it (the component removed it)...
    mocks.search = '';
    rerender(<NoticeToast />);
    // ...and a second password reset sends them back with it.
    mocks.search = 'notice=password-updated';
    rerender(<NoticeToast />);

    expect(mocks.add).toHaveBeenCalledTimes(2);
  });

  it('renders nothing visible', () => {
    mocks.search = 'notice=password-updated';
    const { container } = render(<NoticeToast />);

    expect(container.innerHTML).toBe('');
  });
});
