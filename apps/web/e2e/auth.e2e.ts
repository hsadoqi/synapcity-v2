import { expect, test, type Page } from '@playwright/test';

/** Skip the browser's own checks so the server action's validation runs. */
async function submitWithoutNativeValidation(page: Page, button: string) {
  await page.waitForLoadState('networkidle');
  await page.locator('form:has(#email)').evaluate((form: HTMLFormElement) => {
    form.noValidate = true;
  });
  await page.getByRole('button', { name: button, exact: true }).click();
}

const pages = [
  { path: '/auth/login', heading: 'Sign in' },
  { path: '/auth/register', heading: 'Sign up' },
  { path: '/auth/forgot-password', heading: 'Reset your password' },
  { path: '/auth/error', heading: 'That link did not work' },
];

for (const { path, heading } of pages) {
  test.describe(path, () => {
    test('has one h1 inside a single card', async ({ page }) => {
      await page.goto(path);

      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(
        page.getByRole('heading', { level: 1, name: heading }),
      ).toBeVisible();
      await expect(page.locator('[data-slot="card"]')).toHaveCount(1);
    });

    test('does not scroll sideways on a phone', async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 740 });
      await page.goto(path);

      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBe(0);
    });
  });
}

test.describe('login', () => {
  test('labels its fields and hides the password until asked', async ({
    page,
  }) => {
    await page.goto('/auth/login');
    // The toggle is a client component: a click before hydration does nothing.
    await page.waitForLoadState('networkidle');

    await expect(page.getByLabel('Email')).toHaveAttribute(
      'autocomplete',
      'email',
    );
    const password = page.getByLabel('Password', { exact: true });
    await expect(password).toHaveAttribute('type', 'password');

    const toggle = page.getByRole('button', { name: 'Show password' });
    await toggle.click();
    await expect(password).toHaveAttribute('type', 'text');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await toggle.click();
    await expect(password).toHaveAttribute('type', 'password');
  });

  test('names the submit button by its text', async ({ page }) => {
    await page.goto('/auth/login');

    const submit = page.getByRole('button', { name: 'Sign in', exact: true });
    await expect(submit).toBeVisible();
    await expect(submit).not.toHaveAttribute('aria-label', /.+/);
  });

  test('blocks an empty submit before it reaches the server', async ({
    page,
  }) => {
    await page.goto('/auth/login');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(
      page
        .getByLabel('Email')
        .evaluate((el: HTMLInputElement) => el.validity.valueMissing),
    ).resolves.toBe(true);
  });

  test('carries the destination over to sign up', async ({ page }) => {
    await page.goto('/auth/login?next=/notes/1');

    await expect(
      page.locator('[data-slot="card"]').getByRole('link', { name: /Sign up/ }),
    ).toHaveAttribute('href', '/auth/register?next=%2Fnotes%2F1');
  });

  test('offers password recovery beside the password label', async ({
    page,
  }) => {
    await page.goto('/auth/login');
    const forgot = page.getByRole('link', { name: 'Forgot password?' });

    await expect(forgot).toHaveAttribute('href', '/auth/forgot-password');
    // Same row as the label, and before the field in tab order.
    const [linkBox, labelBox] = await Promise.all([
      forgot.boundingBox(),
      page.locator('label[for="password"]').boundingBox(),
    ]);
    expect(
      Math.abs(
        (linkBox?.y ?? 0) +
          (linkBox?.height ?? 0) / 2 -
          ((labelBox?.y ?? 0) + (labelBox?.height ?? 0) / 2),
      ),
    ).toBeLessThan(4);
    await page.getByLabel('Email').focus();
    await page.keyboard.press('Tab');
    await expect(forgot).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Password', { exact: true })).toBeFocused();
  });

  test('has no nested navigation landmarks in the card', async ({ page }) => {
    await page.goto('/auth/login');

    await expect(page.locator('[data-slot="card"] nav')).toHaveCount(0);
  });
});

test.describe('register', () => {
  test('describes the password rule with the field', async ({ page }) => {
    await page.goto('/auth/register');

    await expect(
      page.getByLabel('Password', { exact: true }),
    ).toHaveAccessibleDescription(
      'At least 8 characters, with a lowercase letter, an uppercase letter, a number and a symbol.',
    );
  });

  test('carries the destination back to sign in', async ({ page }) => {
    await page.goto('/auth/register?next=/notes/1');

    await expect(
      page.getByRole('link', { name: /Already have an account/ }),
    ).toHaveAttribute('href', '/auth/login?next=%2Fnotes%2F1');
  });

  test('ignores an unsafe destination', async ({ page }) => {
    await page.goto('/auth/register?next=//evil.example');

    await expect(
      page.getByRole('link', { name: /Already have an account/ }),
    ).toHaveAttribute('href', '/auth/login');
  });
});

test.describe('forgot password', () => {
  test('keeps the way back inside the card', async ({ page }) => {
    await page.goto('/auth/forgot-password');

    await expect(
      page.locator('[data-slot="card"]').getByRole('link', {
        name: 'Back to sign in',
      }),
    ).toHaveAttribute('href', '/auth/login');
  });
});

test('update password sends a visitor without a reset session to start over', async ({
  page,
}) => {
  await page.goto('/auth/update-password');

  await expect(page).toHaveURL(/\/auth\/forgot-password\?expired=1$/);
  await expect(page.locator('[data-slot="card-description"]')).toHaveText(
    'That reset link has expired or was already used. Enter your email for a new one.',
  );
});

test('error page offers both ways forward', async ({ page }) => {
  await page.goto('/auth/error');
  const card = page.locator('[data-slot="card"]');

  await expect(card.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
    'href',
    '/auth/login',
  );
  await expect(
    card.getByRole('link', { name: 'Reset password' }),
  ).toHaveAttribute('href', '/auth/forgot-password');
});

test.describe('server-side field errors', () => {
  test('login marks both empty fields and links them to the message', async ({
    page,
  }) => {
    await page.goto('/auth/login');
    await submitWithoutNativeValidation(page, 'Sign in');

    const alert = page.locator('form').getByRole('alert');
    await expect(alert).toHaveText('Enter your email and password.');
    const messageId = await alert.getAttribute('id');
    expect(messageId).toBeTruthy();
    for (const field of [
      page.getByLabel('Email'),
      page.getByLabel('Password', { exact: true }),
    ]) {
      await expect(field).toHaveAttribute('aria-invalid', 'true');
      await expect(field).toHaveAttribute('aria-describedby', messageId!);
    }
  });

  test('register marks only the field the error is about', async ({ page }) => {
    await page.goto('/auth/register');
    await page.getByLabel('Name').fill('Ada Lovelace');
    await page.getByLabel('Email').fill('ada@example.com');
    await page.getByLabel('Password', { exact: true }).fill('short');
    await submitWithoutNativeValidation(page, 'Create account');

    const password = page.getByLabel('Password', { exact: true });
    const alert = page.locator('form').getByRole('alert');
    await expect(alert).toHaveText('Use a password of at least 8 characters.');
    const messageId = await alert.getAttribute('id');
    expect(messageId).toBeTruthy();
    await expect(password).toHaveAttribute('aria-invalid', 'true');
    // The message carries the rule while the field is invalid, so the hint
    // steps aside instead of repeating it above the error.
    await expect(password).toHaveAttribute('aria-describedby', messageId!);
    await expect(page.getByText('Use at least 8 characters.')).toHaveCount(0);
    await expect(page.getByLabel('Email')).not.toHaveAttribute(
      'aria-invalid',
      /.*/,
    );
    await expect(page.getByLabel('Name')).not.toHaveAttribute(
      'aria-invalid',
      /.*/,
    );
    // The typed email survives the failed submit.
    await expect(page.getByLabel('Email')).toHaveValue('ada@example.com');
  });
});

test.describe('error page reasons', () => {
  const cases = [
    {
      reason: 'oauth',
      heading: 'Signing in with that provider did not finish',
      primary: ['Back to sign in', '/auth/login'],
    },
    {
      reason: 'confirm',
      heading: 'That confirmation link did not work',
      primary: ['Sign in', '/auth/login'],
      secondary: ['Sign up again', '/auth/register'],
    },
    {
      reason: 'reset',
      heading: 'That reset link did not work',
      primary: ['Request a new link', '/auth/forgot-password'],
      secondary: ['Sign in', '/auth/login'],
    },
    // Unknown or tampered reasons fall back to the general recovery.
    {
      reason: 'nonsense',
      heading: 'That link did not work',
      primary: ['Reset password', '/auth/forgot-password'],
      secondary: ['Sign in', '/auth/login'],
    },
  ] as const;

  for (const { reason, heading, primary, ...rest } of cases) {
    test(`${reason} gets its own recovery`, async ({ page }) => {
      await page.goto(`/auth/error?reason=${reason}`);
      const card = page.locator('[data-slot="card"]');

      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
      const links = card.getByRole('link');
      await expect(links).toHaveCount('secondary' in rest ? 2 : 1);
      await expect(links.first()).toHaveText(primary[0]);
      await expect(links.first()).toHaveAttribute('href', primary[1]);
      if ('secondary' in rest) {
        await expect(links.nth(1)).toHaveText(rest.secondary[0]);
        await expect(links.nth(1)).toHaveAttribute('href', rest.secondary[1]);
      }
    });
  }
});

test.describe('header navigation', () => {
  for (const [path, current, other] of [
    ['/auth/login', 'Sign in', 'Sign up'],
    ['/auth/register', 'Sign up', 'Sign in'],
  ] as const) {
    test(`marks ${current} as the current page on ${path}`, async ({
      page,
    }) => {
      await page.goto(path);
      const header = page.locator('header');

      await expect(
        header.getByRole('link', { name: current, exact: true }),
      ).toHaveAttribute('aria-current', 'page');
      await expect(
        header.getByRole('link', { name: other, exact: true }),
      ).not.toHaveAttribute('aria-current', /.*/);
    });
  }
});

test.describe('focus after a failed submit', () => {
  test('login sends focus to the first empty marked field', async ({
    page,
  }) => {
    await page.goto('/auth/login');
    await submitWithoutNativeValidation(page, 'Sign in');

    await expect(page.locator('form').getByRole('alert')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeFocused();
  });

  test('register skips fields that are fine', async ({ page }) => {
    await page.goto('/auth/register');
    await page.getByLabel('Name').fill('Ada Lovelace');
    await page.getByLabel('Email').fill('ada@example.com');
    await page.getByLabel('Password', { exact: true }).fill('short');
    await submitWithoutNativeValidation(page, 'Create account');

    await expect(page.locator('form').getByRole('alert')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeFocused();
  });

  test('forgot password returns to the email field', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await submitWithoutNativeValidation(page, 'Send reset link');

    await expect(page.locator('form').getByRole('alert')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeFocused();
  });
});

test.describe('forgot password validates in the browser and still works without it', () => {
  test('with JavaScript on, an empty email is refused without a request to the server', async ({
    page,
  }) => {
    const posts: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'POST') posts.push(request.url());
    });
    await page.goto('/auth/forgot-password');
    await submitWithoutNativeValidation(page, 'Send reset link');

    const alert = page.locator('form').getByRole('alert');
    await expect(alert).toHaveText('Enter your email.');
    await expect(page.getByLabel('Email')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await expect(page.getByLabel('Email')).toBeFocused();
    expect(posts).toEqual([]);
  });

  test.describe('with JavaScript off', () => {
    test.use({ javaScriptEnabled: false });

    test('the form still posts to the server action, which refuses an empty email the same way', async ({
      page,
    }) => {
      await page.goto('/auth/forgot-password');
      await page.getByRole('button', { name: 'Send reset link' }).click();

      const alert = page.locator('form').getByRole('alert');
      await expect(alert).toHaveText('Enter your email.');
      const messageId = await alert.getAttribute('id');
      expect(messageId).toBeTruthy();
      await expect(page.getByLabel('Email')).toHaveAttribute(
        'aria-invalid',
        'true',
      );
      await expect(page.getByLabel('Email')).toHaveAttribute(
        'aria-describedby',
        messageId!,
      );
    });
  });
});

test.describe('register validates in the browser and still works without it', () => {
  test('with JavaScript on, a short password is refused without a request, and the reveal still works', async ({
    page,
  }) => {
    const posts: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'POST') posts.push(request.url());
    });
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Name').fill('Ada Lovelace');
    await page.getByLabel('Email').fill('ada@example.com');
    const password = page.getByLabel('Password', { exact: true });
    await password.fill('short');
    await page
      .getByRole('button', { name: 'Create account', exact: true })
      .click();

    await expect(page.locator('form').getByRole('alert')).toHaveText(
      'Use a password of at least 8 characters.',
    );
    await expect(password).toHaveAttribute('aria-invalid', 'true');
    await expect(password).toBeFocused();
    await expect(page.getByLabel('Email')).not.toHaveAttribute(
      'aria-invalid',
      /.*/,
    );
    expect(posts).toEqual([]);

    const toggle = page.getByRole('button', { name: 'Show password' });
    await toggle.click();
    await expect(password).toHaveAttribute('type', 'text');
    await expect(password).toHaveValue('short');
  });

  test.describe('with JavaScript off', () => {
    test.use({ javaScriptEnabled: false });

    test('the form still posts to the server action, which refuses the same way', async ({
      page,
    }) => {
      await page.goto('/auth/register');
      await page.getByLabel('Name').fill('Ada Lovelace');
      await page.getByLabel('Email').fill('ada@example.com');
      await page.getByLabel('Password', { exact: true }).fill('short');
      await page
        .getByRole('button', { name: 'Create account', exact: true })
        .click();

      const alert = page.locator('form').getByRole('alert');
      await expect(alert).toHaveText(
        'Use a password of at least 8 characters.',
      );
      await expect(
        page.getByLabel('Password', { exact: true }),
      ).toHaveAttribute('aria-invalid', 'true');
      await expect(page.getByLabel('Email')).toHaveValue('ada@example.com');
    });
  });
});
