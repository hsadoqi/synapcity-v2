import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const router = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children?: React.ReactNode;
  }) => (
    <a href={href} data-next-link>
      {children}
    </a>
  ),
}));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

import { useCollectionNavigation } from '../providers';
import { NextCollectionNavigation } from './next-collection-navigation';

function Probe() {
  const { Link, push } = useCollectionNavigation();
  return (
    <>
      <Link href="/y">Go</Link>
      <button type="button" onClick={() => push('/y')}>
        Push
      </button>
    </>
  );
}

describe('NextCollectionNavigation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('supplies the Next.js link', () => {
    render(
      <NextCollectionNavigation>
        <Probe />
      </NextCollectionNavigation>,
    );

    expect(
      screen.getByRole('link', { name: 'Go' }).hasAttribute('data-next-link'),
    ).toBe(true);
  });

  it('pushes through the Next.js router', () => {
    render(
      <NextCollectionNavigation>
        <Probe />
      </NextCollectionNavigation>,
    );
    screen.getByRole('button', { name: 'Push' }).click();

    expect(router.push).toHaveBeenCalledWith('/y');
  });
});
