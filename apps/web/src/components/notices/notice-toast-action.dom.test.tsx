import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// No notice in the real list has an action or is an error yet; these cover the
// paths a future one takes, with the list swapped for one that does.
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
vi.mock('@/lib/routing/notices', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/routing/notices')>();
  const NOTICES = {
    'with-action': {
      type: 'success',
      title: 'Space created.',
      action: { label: 'Open it', href: '/abc/home/spaces' },
    },
    'it-failed': { type: 'error', title: 'That did not work.' },
  };
  return {
    ...actual,
    NOTICES,
    isNoticeKey: (value: string | null | undefined) =>
      typeof value === 'string' && Object.hasOwn(NOTICES, value),
  };
});

import { NoticeToast } from './notice-toast';

type AddOptions = {
  actionProps?: { children: string; onClick: () => void };
  priority?: string;
  timeout?: number;
};
const added = () => mocks.add.mock.calls[0]?.[0] as AddOptions;

describe('NoticeToast with an action or an error', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.search = '';
  });

  it('turns an action into a button that closes the toast and goes to its path', () => {
    mocks.search = 'notice=with-action';
    render(<NoticeToast />);

    const action = added().actionProps;
    expect(action?.children).toBe('Open it');

    action?.onClick();
    expect(mocks.close).toHaveBeenCalledWith('notice-with-action');
    expect(mocks.push).toHaveBeenCalledWith('/abc/home/spaces');
  });

  it('announces an error urgently and keeps it until dismissed', () => {
    mocks.search = 'notice=it-failed';
    render(<NoticeToast />);

    expect(added().priority).toBe('high');
    expect(added().timeout).toBe(0);
    expect(added().actionProps).toBeUndefined();
  });
});
