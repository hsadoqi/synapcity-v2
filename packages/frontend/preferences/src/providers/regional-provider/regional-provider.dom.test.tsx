import { act, renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  regionalDefaults,
  type RegionalSettings,
} from '@synapcity/domain-preferences';
import { announcePreferencesSaved, writeStoredPreferences } from '../../store';
import { RegionalProvider, useDateTimeFormatting } from './regional-provider';

const account: RegionalSettings = {
  ...regionalDefaults,
  timeFormat: '24-hour',
  dateFormat: 'DD/MM/YYYY',
  timezone: 'system',
  firstDayOfWeek: 'monday',
};

const withAccount =
  (regional: RegionalSettings | null, deviceTimeZone: string | null) =>
  ({ children }: { children: ReactNode }) => (
    <RegionalProvider regional={regional} deviceTimeZone={deviceTimeZone}>
      {children}
    </RegionalProvider>
  );

const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

beforeEach(() => localStorage.clear());

describe('useDateTimeFormatting', () => {
  it('uses the defaults and this browser zone with no provider and nothing saved', () => {
    const { result } = renderHook(() => useDateTimeFormatting());
    expect(result.current).toEqual({
      locale: 'en',
      timeZone: browserZone,
      hourCycle: 'h12',
      dateFormat: 'MM/DD/YYYY',
      weekStartsOn: 0,
    });
  });

  it('uses the account settings when this browser has no saved copy', () => {
    const { result } = renderHook(() => useDateTimeFormatting(), {
      wrapper: withAccount(account, 'Asia/Tokyo'),
    });
    expect(result.current).toMatchObject({
      hourCycle: 'h23',
      dateFormat: 'DD/MM/YYYY',
      weekStartsOn: 1,
      // In the browser `system` is this browser's zone, not the stored one.
      timeZone: browserZone,
    });
  });

  it('prefers the saved copy and follows saves from the settings page', () => {
    writeStoredPreferences(
      JSON.stringify({ regional: { timezone: 'Europe/Paris' } }),
    );
    const { result } = renderHook(() => useDateTimeFormatting(), {
      wrapper: withAccount(account, null),
    });
    expect(result.current.timeZone).toBe('Europe/Paris');

    act(() => {
      writeStoredPreferences(
        JSON.stringify({
          regional: { timezone: 'Asia/Tokyo', timeFormat: '24-hour' },
        }),
      );
      announcePreferencesSaved();
    });
    expect(result.current).toMatchObject({
      timeZone: 'Asia/Tokyo',
      hourCycle: 'h23',
    });
  });

  it('renders on the server with the account and its last device zone', () => {
    writeStoredPreferences(
      JSON.stringify({ regional: { timezone: 'Europe/Paris' } }),
    );
    function Zone() {
      const { timeZone, hourCycle } = useDateTimeFormatting();
      return <span>{`${timeZone} ${hourCycle}`}</span>;
    }
    const Wrapper = withAccount(account, 'Asia/Tokyo');
    // The server never reads browser storage, so its text can match hydration.
    expect(
      renderToString(
        <Wrapper>
          <Zone />
        </Wrapper>,
      ),
    ).toContain('Asia/Tokyo h23');
  });
});
