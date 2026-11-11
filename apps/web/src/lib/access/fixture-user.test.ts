import { describe, expect, it } from 'vitest';

import { FIXTURE_USER_ID } from './dev-fixture';
import { fixtureUser } from './fixture-user';

describe('fixtureUser', () => {
  it('is the fixture identity, marked as a fixture', () => {
    expect(fixtureUser()).toEqual({
      id: FIXTURE_USER_ID,
      name: 'Fixture user',
      displayName: 'Fixture user',
      email: 'fixture@localhost',
      imageUrl: null,
      fixture: true,
    });
  });
});
