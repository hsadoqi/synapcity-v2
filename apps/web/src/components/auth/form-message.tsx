import type { AuthState } from '@/app/auth/actions';

export function FormMessage({ state }: { state: AuthState }) {
  if (state.error) {
    return (
      <p role="alert" className="text-xs text-destructive">
        {state.error}
      </p>
    );
  }
  if (state.message) {
    return (
      <p role="status" className="text-xs text-muted-foreground">
        {state.message}
      </p>
    );
  }
  return null;
}
