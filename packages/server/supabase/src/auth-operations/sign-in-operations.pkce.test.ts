import { afterEach, describe, expect, it, vi } from 'vitest';

import { createRequestClient } from '../request-client';
import { exchangeAuthCode } from './sign-in-operations';

/*
 * Evidence for review finding A2, against the real SDK rather than a stub:
 * the request client always uses the PKCE flow, so finishing a redirect needs
 * the code verifier cookie that the browser which started the flow holds. An
 * email link opened in any other browser arrives without it, and the exchange
 * fails before Supabase is even asked.
 */

afterEach(() => vi.unstubAllGlobals());

function clientWithCookies(cookies: { name: string; value: string }[]) {
  return createRequestClient({
    url: 'https://project.supabase.co',
    publishableKey: 'sb_publishable_test',
    cookies: { getAll: () => cookies, set: () => {} },
  });
}

describe('exchangeAuthCode without the code verifier', () => {
  it('fails, without a network call, when the link is opened in another browser', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);

    const outcome = await exchangeAuthCode(clientWithCookies([]), 'email-code');

    expect(outcome).toStrictEqual({
      kind: 'failed',
      failure: { code: 'pkce_code_verifier_not_found', status: 400 },
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('asks Supabase when the browser that started the flow opens it', async () => {
    const fetch = vi.fn(async () => new Response('{}', { status: 400 }));
    vi.stubGlobal('fetch', fetch);
    const verifier = {
      name: 'sb-project-auth-token-code-verifier',
      value: JSON.stringify('a-verifier/'),
    };

    await exchangeAuthCode(clientWithCookies([verifier]), 'email-code');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/v1/token?grant_type=pkce'),
      expect.anything(),
    );
  });
});
