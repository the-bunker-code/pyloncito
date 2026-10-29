import { analyticsConfig } from '../config/analytics';
import { readConsent, shouldLoadGtm, type ConsentState } from './consent';

const DEFAULT_CONSENT_SIGNALS = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
} as const;

const EVENT_PARAMS = {
  game_card_click: ['game', 'status'],
  game_start: ['game', 'mode', 'level', 'rounds'],
  level_select: ['game', 'mode', 'level', 'previous_level'],
  answer: [
    'game',
    'mode',
    'level',
    'round',
    'result',
    'attempt',
    'errors',
    'help_count',
    'error_count',
  ],
  round_complete: ['game', 'mode', 'level', 'round', 'total'],
  help_used: ['game', 'mode', 'level', 'round', 'help_count', 'error_count'],
  session_complete: [
    'game',
    'mode',
    'level',
    'rounds',
    'said_count',
    'duration_seconds',
    'help_count',
    'error_count',
  ],
  game_replay: ['game', 'mode', 'level'],
  game_home: ['game'],
  game_exit: ['game', 'mode', 'level', 'round', 'total', 'duration_seconds', 'reason'],
  settings_open: ['game', 'mode', 'level', 'rounds', 'source'],
  settings_cancel: ['game', 'mode', 'level', 'rounds', 'source', 'reason'],
  settings_saved: ['game', 'mode', 'level', 'rounds', 'voice', 'sound', 'previous_level'],
  voice_test: ['surface'],
  guide_open: ['source'],
  web_vitals: ['metric_name', 'metric_value', 'metric_rating', 'page_type'],
} as const satisfies Record<string, readonly string[]>;

export const ANALYTICS_EVENTS = Object.keys(EVENT_PARAMS) as AnalyticsEventName[];
export type AnalyticsEventName = keyof typeof EVENT_PARAMS;
export type AnalyticsParamValue = string | number | boolean;
export type AnalyticsParams = Record<string, AnalyticsParamValue>;

let gtmLoaded = false;
let trackingInitialized = false;
let dataLayerReady = false;
let currentConsent: ConsentState | null = null;

export function isAnalyticsHost(hostname: string, search: string): boolean {
  if (analyticsConfig.productionHosts.some((host) => host === hostname)) return true;
  if (!analyticsConfig.debugHosts.some((host) => host === hostname)) return false;
  return new URLSearchParams(search).has(analyticsConfig.debugParam);
}

export function isAnalyticsEventName(value: string): value is AnalyticsEventName {
  return Object.hasOwn(EVENT_PARAMS, value);
}

export function sanitizeAnalyticsParams(
  name: AnalyticsEventName,
  params: Record<string, unknown>,
): AnalyticsParams {
  const allowed = new Set<string>(EVENT_PARAMS[name]);
  const clean: AnalyticsParams = {};

  for (const [key, value] of Object.entries(params)) {
    if (!allowed.has(key)) continue;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      clean[key] = value;
    }
  }

  return clean;
}

export function sanitizePageLocation(href: string): string {
  try {
    const url = new URL(href);
    url.searchParams.delete(analyticsConfig.debugParam);
    return url.toString();
  } catch {
    return href;
  }
}

export function consentSignals(consent: ConsentState) {
  return {
    ...DEFAULT_CONSENT_SIGNALS,
    analytics_storage: consent.analytics ? 'granted' : 'denied',
  };
}

function ensureDataLayer(): void {
  window.dataLayer = window.dataLayer ?? [];
  window.gtag =
    window.gtag ??
    ((...args: unknown[]) => {
      window.dataLayer?.push(args);
    });

  if (dataLayerReady) return;

  const debugMode = new URLSearchParams(window.location.search).has(analyticsConfig.debugParam);
  const internalTraffic =
    debugMode || analyticsConfig.debugHosts.some((host) => host === window.location.hostname);

  window.gtag('consent', 'default', DEFAULT_CONSENT_SIGNALS);
  window.dataLayer.push({
    page_location: sanitizePageLocation(window.location.href),
    debug_mode: debugMode,
    traffic_type: internalTraffic ? 'internal' : 'external',
    app_version: __APP_VERSION__,
  });
  dataLayerReady = true;
}

function updateDataLayerConsent(consent: ConsentState): void {
  window.gtag?.('consent', 'update', consentSignals(consent));
  window.dataLayer?.push({
    event: 'pyloncito_consent_update',
    consent_analytics: consent.analytics,
    consent_improvement: consent.improvement,
    consent_marketing: false,
  });
}

function loadGtm(consent: ConsentState): void {
  if (gtmLoaded) return;

  ensureDataLayer();
  updateDataLayerConsent(consent);
  window.dataLayer?.push({ 'gtm.start': Date.now(), event: 'gtm.js' });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${analyticsConfig.gtmId}`;
  document.head.append(script);
  gtmLoaded = true;
}

function announceConsent(consent: ConsentState): void {
  window.dispatchEvent(new CustomEvent('pyloncito:consent', { detail: consent }));
}

export function clearAnalyticsCookies(): void {
  const host = window.location.hostname;
  const domain = host.endsWith('pyloncito.app') ? '.pyloncito.app' : null;

  for (const entry of document.cookie.split(';')) {
    const name = entry.split('=')[0]?.trim();
    if (!name) continue;
    if (!analyticsConfig.cookiePrefixes.some((prefix) => name.startsWith(prefix))) continue;

    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    if (domain) {
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}; SameSite=Lax`;
    }
  }
}

export function applyConsent(consent: ConsentState): void {
  currentConsent = consent;

  if (!shouldLoadGtm(consent)) {
    clearAnalyticsCookies();
    if (gtmLoaded) window.location.reload();
    announceConsent(consent);
    return;
  }

  if (!isAnalyticsHost(window.location.hostname, window.location.search)) return;

  if (!gtmLoaded) {
    loadGtm(consent);
  } else {
    updateDataLayerConsent(consent);
  }

  if (!consent.analytics) clearAnalyticsCookies();
  announceConsent(consent);
}

export function trackEvent(name: AnalyticsEventName, params: Record<string, unknown> = {}): void {
  const consent = currentConsent ?? readConsent();
  if (!consent?.analytics || !gtmLoaded) return;

  window.dataLayer?.push({ event: name, ...sanitizeAnalyticsParams(name, params) });
}

function handleClick(event: MouseEvent): void {
  const target = (event.target as Element | null)?.closest<HTMLElement>('[data-analytics-event]');
  if (!target) return;

  const name = target.dataset.analyticsEvent;
  if (!name || !isAnalyticsEventName(name)) return;

  const params: Record<string, string> = {};
  if (target.dataset.game) params.game = target.dataset.game;
  if (target.dataset.status) params.status = target.dataset.status;
  if (target.dataset.analyticsSource) params.source = target.dataset.analyticsSource;
  trackEvent(name, params);
}

export function initAnalytics(): void {
  if (!isAnalyticsHost(window.location.hostname, window.location.search)) return;

  ensureDataLayer();
  if (!trackingInitialized) {
    document.addEventListener('click', handleClick);
    trackingInitialized = true;
  }
}
