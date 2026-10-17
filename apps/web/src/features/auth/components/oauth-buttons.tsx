import { Button } from '@synapcity/frontend-ui/core/button';

import { signInWithOAuth } from '@/features/auth/server/actions';

export function OAuthButtons({ next }: { next: string }) {
  return (
    <form action={signInWithOAuth} className="flex flex-col gap-2">
      <input type="hidden" name="next" value={next} />
      <Button
        type="submit"
        name="provider"
        value="google"
        variant="outline"
        size="lg"
      >
        Continue with Google
      </Button>
      <Button
        type="submit"
        name="provider"
        value="github"
        variant="outline"
        size="lg"
      >
        Continue with GitHub
      </Button>
    </form>
  );
}
