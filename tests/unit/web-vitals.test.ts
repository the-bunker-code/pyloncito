import { describe, expect, it } from 'vitest';
import { pageType, toWebVitalsParams } from '../../src/lib/web-vitals';

describe('web vitals', () => {
  it('maps paths to a small page type', () => {
    expect(pageType('/')).toBe('hub');
    expect(pageType('/juegos/mira-y-dime/')).toBe('game');
    expect(pageType('/guia/')).toBe('guide');
    expect(pageType('/cookies/')).toBe('cookies');
    expect(pageType('/privacidad/')).toBe('privacy');
    expect(pageType('/creditos/')).toBe('credits');
    expect(pageType('/otra/')).toBe('page');
  });

  it('builds analytics parameters without exposing urls or entries', () => {
    expect(toWebVitalsParams({ name: 'LCP', value: 1234.56789, rating: 'good' }, 'game')).toEqual({
      metric_name: 'LCP',
      metric_value: 1234.568,
      metric_rating: 'good',
      page_type: 'game',
    });
  });
});
