/**
 * The address the person signs in with, for reference. Changing it is a
 * sign-in change that needs re-verification, so it belongs to the auth
 * feature's forms, not to the profile editors beside it.
 */
export function EmailSummary({ email }: { email: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">Email</span>
      <span className="text-sm font-medium">
        {email ?? 'No email on this account'}
      </span>
    </div>
  );
}
