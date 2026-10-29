import { describe, expect, it } from 'vitest';
import { isAnalyticsHost } from '../../src/lib/analytics';

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
