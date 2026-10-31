import { AuthButtons } from '@synapcity/features-auth/frontend';
import { LinkButton } from '@synapcity/frontend-ui/next/link-button';
import { UserMenu } from '@synapcity/frontend-ui/components/user-menu';

import { signOut } from '@/features/auth/server/actions/actions';
import { accountLinksFor, homePathFor } from '@/lib/routing/user-paths';
import { getCurrentUser } from '@/features/auth/server/session';
import { FIXTURE_MESSAGE } from '@/lib/access/dev-fixture';
import { cn } from '@/lib/utils';

/**
 * Reads the verified session claims on the server (ADR-0006) so the first paint
 * already matches the signed-in state. Claims are for display only.
 */
export async function AuthStatus({
  variant = 'header',
}: {
  /** `sidebar` is the account row for the sidebar's foot; it shows nothing signed out. */
  variant?: 'header' | 'hero' | 'sidebar';
}) {
  const user = await getCurrentUser();

  if (!user && variant === 'sidebar') return null;

  if (!user) {
    return (
      <AuthButtons
        signInHref="/auth/login"
        signUpHref="/auth/register"
        quietPathPrefix="/auth"
        variant={variant === 'sidebar' ? 'header' : variant}
      />
    );
  }

  if (variant === 'hero') {
    return (
      <LinkButton href={homePathFor(user.id)} variant="default" size="lg">
        Go to your workspace
      </LinkButton>
    );
  }

  if (user.fixture) {
    return (
      <span
        title={FIXTURE_MESSAGE}
        className={cn(
          'rounded-md border border-border px-2 py-1 text-xs text-muted-foreground',
          // Folded to icons, the sidebar has no room for the label.
          variant === 'sidebar' && 'group-data-[collapsible=icon]:hidden',
        )}
      >
        Fixture mode
      </span>
    );
  }

  return (
    <UserMenu
      variant={variant === 'sidebar' ? 'sidebar' : 'icon'}
      {...accountLinksFor(user.id)}
      name={user.name}
      email={user.email}
      imageUrl={user.imageUrl}
      onSignOut={signOut}
    />
  );
}
