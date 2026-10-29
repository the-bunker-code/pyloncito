import { describe, expect, it } from 'vitest';
import {
  isAnalyticsEventName,
  isAnalyticsHost,
  sanitizeAnalyticsParams,
  sanitizePageLocation,
} from '../../src/lib/analytics';

describe('analytics host', () => {
  it('allows production hosts', () => {
    expect(isAnalyticsHost('pyloncito.app', '')).toBe(true);
    expect(isAnalyticsHost('www.pyloncito.app', '')).toBe(true);
  });

  it('blocks dev, workers and localhost by default', () => {
    expect(isAnalyticsHost('dev.pyloncito.app', '')).toBe(false);
    expect(isAnalyticsHost('pyloncito.enlabe.workers.dev', '')).toBe(false);
    expect(isAnalyticsHost('localhost', '')).toBe(false);
  });

  it('allows debug hosts only with gtm_debug', () => {
    expect(isAnalyticsHost('dev.pyloncito.app', '?gtm_debug=1')).toBe(true);
    expect(isAnalyticsHost('localhost', '?gtm_debug=1')).toBe(true);
    expect(isAnalyticsHost('dev.pyloncito.app', '?foo=1')).toBe(false);
  });
});

describe('analytics events', () => {
  it('accepts only known event names', () => {
    expect(isAnalyticsEventName('game_start')).toBe(true);
    expect(isAnalyticsEventName('answer')).toBe(true);
    expect(isAnalyticsEventName('level_select')).toBe(true);
    expect(isAnalyticsEventName('game_exit')).toBe(true);
    expect(isAnalyticsEventName('settings_open')).toBe(true);
    expect(isAnalyticsEventName('settings_cancel')).toBe(true);
    expect(isAnalyticsEventName('web_vitals')).toBe(true);
    expect(isAnalyticsEventName('round_said')).toBe(false);
    expect(isAnalyticsEventName('not_allowed')).toBe(false);
    expect(isAnalyticsEventName('toString')).toBe(false);
  });

  it('keeps only allowed parameters with primitive values', () => {
    expect(
      sanitizeAnalyticsParams('game_start', {
        game: 'mira-y-dime',
        mode: 'syllables',
        level: 'easy',
        rounds: 3,
        name: 'Ana',
        nested: { child: 'data' },
      }),
    ).toEqual({ game: 'mira-y-dime', mode: 'syllables', level: 'easy', rounds: 3 });
  });

  it('drops parameters from another event', () => {
    expect(
      sanitizeAnalyticsParams('game_card_click', { game: 'mira-y-dime', mode: 'letters' }),
    ).toEqual({ game: 'mira-y-dime' });
  });

  it('keeps answer parameters and drops unrelated values', () => {
    expect(
      sanitizeAnalyticsParams('answer', {
        game: 'mira-y-dime',
        mode: 'syllables',
        level: 'easy',
        round: 1,
        result: 'incorrect',
        attempt: 2,
        errors: 1,
        help_count: 0,
        error_count: 1,
        name: 'Ana',
      }),
    ).toEqual({
      game: 'mira-y-dime',
      mode: 'syllables',
      level: 'easy',
      round: 1,
      result: 'incorrect',
      attempt: 2,
      errors: 1,
      help_count: 0,
      error_count: 1,
    });
  });

  it('removes the debug parameter from page locations', () => {
    expect(sanitizePageLocation('https://pyloncito.app/juegos/mira-y-dime/?gtm_debug=1')).toBe(
      'https://pyloncito.app/juegos/mira-y-dime/',
    );
  });
});
