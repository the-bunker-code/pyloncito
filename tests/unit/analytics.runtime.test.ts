import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConsentState } from '../../src/lib/consent';

interface AnalyticsWindow extends Window {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
}

function consent(analytics: boolean): ConsentState {
  return {
    version: 1,
    analytics,
    improvement: false,
    marketing: false,
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('analytics runtime', () => {
  beforeEach(() => {
    vi.resetModules();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    window.history.replaceState({}, '', '/?gtm_debug=1');
    delete (window as AnalyticsWindow).dataLayer;
    delete (window as AnalyticsWindow).gtag;
  });

  it('does nothing outside analytics hosts', async () => {
    window.history.replaceState({}, '', '/');
    const { initAnalytics } = await import('../../src/lib/analytics');
    initAnalytics();
    expect((window as AnalyticsWindow).dataLayer).toBeUndefined();
  });

  it('initializes the data layer once on a debug host', async () => {
    const { initAnalytics } = await import('../../src/lib/analytics');
    initAnalytics();
    initAnalytics();
    const layer = (window as AnalyticsWindow).dataLayer ?? [];
    expect(
      layer.filter(
        (entry) => typeof entry === 'object' && entry !== null && 'app_version' in entry,
      ),
    ).toHaveLength(1);
    expect(layer[0]).toEqual([
      'consent',
      'default',
      {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
      },
    ]);
  });

  it('loads GTM after consent and sends sanitized events', async () => {
    const { applyConsent, initAnalytics, trackEvent } = await import('../../src/lib/analytics');
    initAnalytics();
    applyConsent(consent(true));

    expect(
      document.head.querySelector('script[src*="googletagmanager.com/gtm.js"]'),
    ).not.toBeNull();
    trackEvent('game_start', {
      game: 'mira-y-dime',
      mode: 'syllables',
      level: 'easy',
      rounds: 3,
      name: 'Ana',
    });

    const layer = (window as AnalyticsWindow).dataLayer ?? [];
    expect(layer).toContainEqual(
      expect.objectContaining({
        event: 'game_start',
        game: 'mira-y-dime',
        mode: 'syllables',
        level: 'easy',
        rounds: 3,
      }),
    );
    expect(
      layer.some((entry) => typeof entry === 'object' && entry !== null && 'name' in entry),
    ).toBe(false);
  });

  it('does not track without consent', async () => {
    const { applyConsent, initAnalytics, trackEvent } = await import('../../src/lib/analytics');
    initAnalytics();
    applyConsent(consent(false));
    trackEvent('game_start', { game: 'mira-y-dime' });
    const layer = (window as AnalyticsWindow).dataLayer ?? [];
    expect(
      layer.some(
        (entry) =>
          typeof entry === 'object' &&
          entry !== null &&
          'event' in entry &&
          entry.event === 'game_start',
      ),
    ).toBe(false);
  });

  it('announces rejection and clears analytics cookies', async () => {
    const { applyConsent } = await import('../../src/lib/analytics');
    const announced = vi.fn();
    window.addEventListener('pyloncito:consent', announced);
    document.cookie = '_ga=1';
    applyConsent(consent(false));
    expect(announced).toHaveBeenCalled();
  });

  it('handles delegated analytics clicks', async () => {
    const { applyConsent, initAnalytics } = await import('../../src/lib/analytics');
    initAnalytics();
    applyConsent(consent(true));
    const button = document.createElement('button');
    button.dataset.analyticsEvent = 'game_card_click';
    button.dataset.game = 'mira-y-dime';
    button.dataset.status = 'beta';
    document.body.append(button);
    button.click();

    const layer = (window as AnalyticsWindow).dataLayer ?? [];
    expect(layer).toContainEqual(
      expect.objectContaining({
        event: 'game_card_click',
        game: 'mira-y-dime',
        status: 'beta',
      }),
    );
  });

  it('ignores clicks without a valid event name', async () => {
    const { applyConsent, initAnalytics } = await import('../../src/lib/analytics');
    initAnalytics();
    applyConsent(consent(true));
    const button = document.createElement('button');
    button.dataset.analyticsEvent = 'not_allowed';
    document.body.append(button);
    button.click();
    const layer = ((window as AnalyticsWindow).dataLayer ?? []) as Array<Record<string, unknown>>;
    expect(layer.some((entry) => entry.event === 'not_allowed')).toBe(false);
  });

  it('builds consent signals and rejects invalid page URLs', async () => {
    const { consentSignals, sanitizePageLocation } = await import('../../src/lib/analytics');
    expect(consentSignals(consent(true)).analytics_storage).toBe('granted');
    expect(consentSignals(consent(false)).analytics_storage).toBe('denied');
    expect(sanitizePageLocation('not a url')).toBe('not a url');
  });
});
