import { AuthButtons } from '@synapcity/frontend-ui/components/auth-buttons';
import { LinkButton } from '@synapcity/frontend-ui/components/link-button';
import { UserMenu } from '@synapcity/frontend-ui/components/user-menu';

import { homePathFor, settingsPathFor } from '@/lib/auth/home-path/home-path';
import { getCurrentUser } from '@/lib/auth/session';

import { SignOutButton } from '../buttons/sign-out-button';

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

  if (!user) return <AuthButtons variant={variant} />;

  if (variant === 'hero') {
    return (
      <LinkButton href={homePathFor(user.id)} variant="default" size="lg">
        Go to your workspace
      </LinkButton>
    );
  }

  return (
    <UserMenu name={user.name} email={user.email} imageUrl={user.imageUrl}>
      <LinkButton href={settingsPathFor(user.id)} variant="ghost" size="sm">
        Account settings
      </LinkButton>
      <SignOutButton />
    </UserMenu>
  );
}
