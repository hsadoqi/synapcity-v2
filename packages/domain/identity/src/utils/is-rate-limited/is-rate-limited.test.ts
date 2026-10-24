import { describe, expect, it } from 'vitest';

import { isRateLimited } from './is-rate-limited';

describe('isRateLimited', () => {
  it.each(['over_email_send_rate_limit', 'over_request_rate_limit'])(
    'treats %s as rate limiting',
    (code) => {
      expect(isRateLimited(code)).toBe(true);
    },
  );

  it.each([undefined, '', 'invalid_credentials', 'user_already_exists'])(
    'does not treat %j as rate limiting',
    (code) => {
      expect(isRateLimited(code)).toBe(false);
    },
  );
});
