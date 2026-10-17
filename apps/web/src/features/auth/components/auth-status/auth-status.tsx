import { AuthButtons } from '@synapcity/frontend-ui/components/auth-buttons';
import { LinkButton } from '@synapcity/frontend-ui/components/link-button';
import { UserMenu } from '@synapcity/frontend-ui/components/user-menu';

import { signOut } from '@/features/auth/server/actions/actions';
import { accountLinksFor, homePathFor } from '@/lib/routing/user-paths';
import { getCurrentUser } from '@/features/auth/server/session';
import { FIXTURE_MESSAGE } from '@/lib/access/dev-fixture';

/**
 * Reads the verified session claims on the server (ADR-0006) so the first paint
 * already matches the signed-in state. Claims are for display only.
 */
export async function AuthStatus({
  variant = 'header',
}: {
  variant?: 'header' | 'hero';
}) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <AuthButtons
        signInHref="/auth/login"
        signUpHref="/auth/register"
        quietPathPrefix="/auth"
        variant={variant}
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
        className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground"
      >
        Fixture mode
      </span>
    );
  }

  return (
    <UserMenu
      {...accountLinksFor(user.id)}
      name={user.name}
      email={user.email}
      imageUrl={user.imageUrl}
      onSignOut={signOut}
    />
  );
}
