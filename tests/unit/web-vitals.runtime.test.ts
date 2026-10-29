import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  trackEvent: vi.fn(),
  callbacks: {} as Record<
    string,
    (metric: { name: string; value: number; rating: string }) => void
  >,
  consent: null as { analytics: boolean } | null,
}));

vi.mock('../../src/lib/analytics', () => ({ trackEvent: mocks.trackEvent }));
vi.mock('../../src/lib/consent', () => ({ readConsent: () => mocks.consent }));
vi.mock('web-vitals', () => ({
  onCLS: (callback: (metric: unknown) => void) => {
    mocks.callbacks.CLS = callback as typeof mocks.callbacks.CLS;
  },
  onFCP: (callback: (metric: unknown) => void) => {
    mocks.callbacks.FCP = callback as typeof mocks.callbacks.FCP;
  },
  onINP: (callback: (metric: unknown) => void) => {
    mocks.callbacks.INP = callback as typeof mocks.callbacks.INP;
  },
  onLCP: (callback: (metric: unknown) => void) => {
    mocks.callbacks.LCP = callback as typeof mocks.callbacks.LCP;
  },
  onTTFB: (callback: (metric: unknown) => void) => {
    mocks.callbacks.TTFB = callback as typeof mocks.callbacks.TTFB;
  },
}));

describe('web vitals runtime', () => {
  beforeEach(() => {
    vi.resetModules();
    window.history.replaceState({}, '', '/juegos/mira-y-dime/');
    mocks.trackEvent.mockClear();
    mocks.consent = null;
    for (const key of Object.keys(mocks.callbacks)) delete mocks.callbacks[key];
  });

  it('queues metrics without consent and flushes them after accepting', async () => {
    const { initWebVitals } = await import('../../src/lib/web-vitals');
    initWebVitals();
    expect(Object.keys(mocks.callbacks).sort()).toEqual(['CLS', 'FCP', 'INP', 'LCP', 'TTFB']);

    mocks.callbacks.LCP?.({ name: 'LCP', value: 1200.123, rating: 'good' });
    expect(mocks.trackEvent).not.toHaveBeenCalled();

    mocks.consent = { analytics: true };
    window.dispatchEvent(new CustomEvent('pyloncito:consent', { detail: mocks.consent }));
    expect(mocks.trackEvent).toHaveBeenCalledWith('web_vitals', {
      metric_name: 'LCP',
      metric_value: 1200.123,
      metric_rating: 'good',
      page_type: 'game',
    });
  });

  it('drops queued metrics when consent is rejected', async () => {
    const { initWebVitals } = await import('../../src/lib/web-vitals');
    initWebVitals();
    mocks.callbacks.CLS?.({ name: 'CLS', value: 0.01, rating: 'good' });
    mocks.consent = { analytics: false };
    window.dispatchEvent(new CustomEvent('pyloncito:consent', { detail: mocks.consent }));
    mocks.consent = { analytics: true };
    window.dispatchEvent(new CustomEvent('pyloncito:consent', { detail: mocks.consent }));
    expect(mocks.trackEvent).not.toHaveBeenCalled();
  });

  it('reports immediately when consent already exists', async () => {
    mocks.consent = { analytics: true };
    const { initWebVitals } = await import('../../src/lib/web-vitals');
    initWebVitals();
    mocks.callbacks.FCP?.({ name: 'FCP', value: 300, rating: 'good' });
    expect(mocks.trackEvent).toHaveBeenCalledTimes(1);
  });
});
