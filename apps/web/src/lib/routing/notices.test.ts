import { describe, expect, it } from 'vitest';

import {
  NOTICES,
  NOTICE_PARAM,
  NOTICE_TIMEOUTS,
  isNoticeKey,
  noticeTimeout,
  withNotice,
} from './notices';

describe('isNoticeKey', () => {
  it('accepts every listed key', () => {
    for (const key of Object.keys(NOTICES)) expect(isNoticeKey(key)).toBe(true);
  });

  it.each([
    'unknown',
    '',
    null,
    undefined,
    // Inherited names on the object, not keys of the list.
    'constructor',
    'toString',
    '__proto__',
    'hasOwnProperty',
  ])('refuses %j', (value) => {
    expect(isNoticeKey(value)).toBe(false);
  });
});

describe('NOTICES', () => {
  const notices = Object.values(NOTICES);

  it('gives every notice plain, non-empty wording', () => {
    for (const { title, description } of notices) {
      expect(title.length).toBeGreaterThan(0);
      for (const text of [title, description ?? '']) {
        expect(text).not.toMatch(/[<>]/);
      }
    }
  });

  it('ends every sentence with a full stop, matching the rest of the app', () => {
    for (const { title, description } of notices) {
      expect(title).toMatch(/\.$/);
      if (description) expect(description).toMatch(/\.$/);
    }
  });

  it('gives every notice a known type and a usable timeout', () => {
    for (const notice of notices) {
      expect(Object.keys(NOTICE_TIMEOUTS)).toContain(notice.type);
      expect(noticeTimeout(notice)).toBeGreaterThanOrEqual(0);
    }
  });

  it('only links an action to a same-origin path', () => {
    for (const { action } of notices) {
      if (!action) continue;
      expect(action.label.length).toBeGreaterThan(0);
      expect(action.href).toMatch(/^\/(?!\/)/);
    }
  });
});

describe('noticeTimeout', () => {
  it('uses the type default when the notice does not set one', () => {
    expect(noticeTimeout({ type: 'success', title: 'Done.' })).toBe(
      NOTICE_TIMEOUTS.success,
    );
  });

  it('keeps an error until it is dismissed', () => {
    expect(noticeTimeout({ type: 'error', title: 'Failed.' })).toBe(0);
  });

  it('lets a notice set its own, including zero', () => {
    expect(noticeTimeout({ type: 'info', title: 'Hi.', timeout: 0 })).toBe(0);
    expect(
      noticeTimeout({ type: 'success', title: 'Hi.', timeout: 1234 }),
    ).toBe(1234);
  });
});

describe('withNotice', () => {
  it('adds the notice to a path', () => {
    expect(withNotice('/abc/home', 'password-updated')).toBe(
      `/abc/home?${NOTICE_PARAM}=password-updated`,
    );
  });

  it('keeps an existing query and fragment', () => {
    expect(withNotice('/abc/home?tab=2#top', 'password-updated')).toBe(
      '/abc/home?tab=2&notice=password-updated#top',
    );
  });

  it('replaces a notice that is already there instead of doubling it', () => {
    expect(
      withNotice('/abc/home?notice=password-updated', 'password-updated'),
    ).toBe('/abc/home?notice=password-updated');
  });

  it('stays a same-origin path', () => {
    expect(withNotice('/abc/home', 'password-updated').startsWith('/')).toBe(
      true,
    );
    expect(withNotice('/abc/home', 'password-updated')).not.toMatch(/^\/\//);
  });
});

describe('the email notices', () => {
  it('say the address was updated, and what to do after the first of two links', () => {
    expect(NOTICES['email-updated']).toEqual({
      type: 'success',
      title: 'Email address updated.',
    });
    const step = NOTICES['email-change-step'];
    // Nothing has changed yet, so it is information, not success.
    expect(step.type).toBe('info');
    expect(step.description).toMatch(/other address/i);
    // Two sentences to read: longer than the info default.
    expect(noticeTimeout(step)).toBeGreaterThan(NOTICE_TIMEOUTS.info);
  });
});

describe('the account-connected notice', () => {
  it('is a success with plain wording', () => {
    expect(NOTICES['account-connected']).toEqual({
      type: 'success',
      title: 'Account connected.',
    });
  });
});

describe('the account-deleted notice', () => {
  it('confirms the deletion and the sign-out', () => {
    const notice = NOTICES['account-deleted'];
    expect(notice.type).toBe('success');
    expect(notice.title).toBe('Your account has been deleted.');
    expect(notice.description).toMatch(/signed out everywhere/i);
  });
});
