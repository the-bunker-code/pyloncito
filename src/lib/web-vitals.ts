import { onCLS, onFCP, onINP, onLCP, onTTFB, type MetricType } from 'web-vitals';
import { trackEvent, type AnalyticsParams } from './analytics';
import { readConsent, type ConsentState } from './consent';

interface WebVitalLike {
  name: string;
  value: number;
  rating: string;
}

const pending: MetricType[] = [];
let initialized = false;

export function pageType(path: string = window.location.pathname): string {
  if (path === '/') return 'hub';
  if (path.startsWith('/juegos/')) return 'game';
  if (path.startsWith('/guia')) return 'guide';
  if (path.startsWith('/cookies')) return 'cookies';
  if (path.startsWith('/privacidad')) return 'privacy';
  if (path.startsWith('/creditos')) return 'credits';
  return 'page';
}

export function toWebVitalsParams(metric: WebVitalLike, page: string): AnalyticsParams {
  return {
    metric_name: metric.name,
    metric_value: Number(metric.value.toFixed(3)),
    metric_rating: metric.rating,
    page_type: page,
  };
}

function report(metric: MetricType): void {
  const consent = readConsent();
  if (!consent?.analytics) {
    pending.push(metric);
    return;
  }

  trackEvent('web_vitals', toWebVitalsParams(metric, pageType()));
}

function flush(): void {
  for (const metric of pending.splice(0)) {
    trackEvent('web_vitals', toWebVitalsParams(metric, pageType()));
  }
}

export function initWebVitals(): void {
  if (initialized) return;
  initialized = true;

  window.addEventListener('pyloncito:consent', (event) => {
    const consent = (event as CustomEvent<ConsentState>).detail;
    if (consent.analytics) {
      flush();
    } else {
      pending.length = 0;
    }
  });

  onCLS(report);
  onFCP(report);
  onINP(report);
  onLCP(report);
  onTTFB(report);
}
