import type { ErrorEvent } from '@sentry/browser';
import { describe, expect, it } from 'vitest';

import { scrubEvent, scrubText, scrubUrl } from './scrub-event';

const userId = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

describe('scrubUrl', () => {
  it('drops the query and hash and replaces id segments', () => {
    expect(
      scrubUrl(`https://app.example/${userId}/settings?code=secret#tab`),
    ).toBe('https://app.example/:id/settings');
  });

  it('keeps a path without ids as it is', () => {
    expect(scrubUrl('https://app.example/_next/static/chunks/main.js')).toBe(
      'https://app.example/_next/static/chunks/main.js',
    );
  });

  it('drops what is not an absolute URL', () => {
    expect(scrubUrl('not a url')).toBeUndefined();
  });
});

describe('scrubEvent', () => {
  const event: ErrorEvent = {
    type: undefined,
    user: { id: userId, email: 'grace@example.com', ip_address: '1.2.3.4' },
    breadcrumbs: [{ message: 'typed something' }],
    request: {
      url: `https://app.example/${userId}/settings?code=secret`,
      headers: { cookie: 'session=abc' },
      cookies: { session: 'abc' },
      query_string: 'code=secret',
    },
    exception: {
      values: [
        {
          type: 'TypeError',
          value: 'x is undefined',
          stacktrace: {
            frames: [
              {
                filename: `https://app.example/${userId}/settings?v=1`,
                abs_path: `https://app.example/${userId}/settings?v=1`,
                function: 'render',
              },
            ],
          },
        },
      ],
    },
  };

  it('removes the person, breadcrumbs, headers, cookies and query', () => {
    const scrubbed = scrubEvent(event);
    expect(scrubbed.user).toBeUndefined();
    expect(scrubbed.breadcrumbs).toBeUndefined();
    expect(scrubbed.request).toEqual({
      url: 'https://app.example/:id/settings',
    });
  });

  it('keeps the error and its stack, with ids removed from frame URLs', () => {
    const [value] = scrubEvent(event).exception!.values!;
    expect(value!.type).toBe('TypeError');
    expect(value!.value).toBe('x is undefined');
    expect(value!.stacktrace!.frames![0]).toEqual({
      filename: 'https://app.example/:id/settings',
      abs_path: 'https://app.example/:id/settings',
      function: 'render',
    });
  });

  it('does not change the event it was given', () => {
    scrubEvent(event);
    expect(event.user?.id).toBe(userId);
  });

  it('never leaves the id anywhere in the report', () => {
    expect(JSON.stringify(scrubEvent(event))).not.toContain(userId);
  });

  it('removes ids and email addresses from the error message and a message event', () => {
    const scrubbed = scrubEvent({
      type: undefined,
      message: `Lookup failed for ${userId}`,
      exception: {
        values: [{ type: 'Error', value: 'No account for grace@example.com' }],
      },
    });
    expect(scrubbed.message).toBe('Lookup failed for :id');
    expect(scrubbed.exception!.values![0]!.value).toBe(
      'No account for [email]',
    );
  });
});

describe('scrubText', () => {
  it('leaves ordinary text alone', () => {
    expect(scrubText('Cannot read properties of undefined')).toBe(
      'Cannot read properties of undefined',
    );
  });

  it('replaces every id and email address in the text', () => {
    expect(
      scrubText(`${userId} and ${userId.toUpperCase()} sent to a.b+c@x.co.uk.`),
    ).toBe(':id and :id sent to [email].');
  });
});
