import { NextResponse, type NextRequest } from 'next/server';

import {
  authErrorPath,
  parseAuthFlow,
  welcomePath,
} from '@/lib/routing/auth-flow';
import { homePathFor } from '@/lib/routing/user-paths';
import { safeNextPath } from '@/lib/routing/safe-next';
import { withNotice } from '@/lib/routing/notices';
import { createClient } from '@/lib/supabase/server';
import { exchangeAuthCode } from '@synapcity/server-supabase';

/**
 * Redirects with a relative `Location`, so the browser resolves it against the
 * address it just requested. An absolute URL would have to be built from
 * `request.nextUrl.origin`, and Next rewrites every loopback host (`127.0.0.1`,
 * `[::1]`) to `localhost` there, which sent a local browser to another origin
 * than the one holding the session cookies this response sets. Relative also
 * means no `Host` or forwarded header is ever trusted. The target is a path
 * built by this app; anything that is not a single-slash path goes home.
 */
function redirectTo(path: string): NextResponse {
  const safe = /^\/(?![/\\])/.test(path) ? path : '/';
  return new NextResponse(null, { status: 307, headers: { location: safe } });
}

/**
 * Landing point for every Supabase redirect: OAuth sign-in, the email
 * confirmation link and the password-reset link all return here with a `code`
 * that is exchanged for a session (PKCE).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next');
  // Set by the action that started the flow, so a failure can say which link broke.
  const flow = parseAuthFlow(searchParams.get('flow'));

  if (code) {
    const outcome = await exchangeAuthCode(await createClient(), code);
    if (outcome.kind === 'signed-in') {
      // No (or an unsafe) `next`: send them to their own home.
      const destination = safeNextPath(next, homePathFor(outcome.userId));
      // A new account is asked once to confirm its name and photo. Only when
      // the link was a sign-up or a provider sign-in: a password reset is
      // someone who already has an account. If anything about the account is
      // unknown, the answer is no, so doubt never adds a step.
      const welcome =
        (flow === 'oauth' || flow === 'confirm') && outcome.needsProfileSetup;
      // A confirmed email change, or a newly connected account, lands back
      // where it was asked for, saying so.
      const arrival =
        flow === 'email-change'
          ? withNotice(destination, 'email-updated')
          : flow === 'link'
            ? withNotice(destination, 'account-connected')
            : welcome
              ? welcomePath(destination)
              : destination;
      return redirectTo(arrival);
    }
  }

  // With "Secure email change" on, the first of the two links is accepted but
  // does not finish the change, so it comes back with a `message` and no code.
  // That is not a failure. A failed link carries `error` instead, and the
  // message text itself is never shown (the notice wording is ours).
  // ASSUMPTION about the provider: this is how the link comes back; it needs
  // checking against a real email change.
  if (
    !code &&
    flow === 'email-change' &&
    searchParams.has('message') &&
    !searchParams.has('error') &&
    !searchParams.has('error_code')
  ) {
    const back = safeNextPath(next, '/');
    return redirectTo(withNotice(back, 'email-change-step'));
  }

  return redirectTo(authErrorPath(flow));
}
