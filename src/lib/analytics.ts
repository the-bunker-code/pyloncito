import { analyticsConfig } from '../config/analytics';
import { readConsent, shouldLoadGtm, type ConsentState } from './consent';

let gtmLoaded = false;
let trackingInitialized = false;
let currentConsent: ConsentState | null = null;

export function isAnalyticsHost(hostname: string, search: string): boolean {
  if (analyticsConfig.productionHosts.some((host) => host === hostname)) return true;
  if (!analyticsConfig.debugHosts.some((host) => host === hostname)) return false;
  return new URLSearchParams(search).has(analyticsConfig.debugParam);
}

function consentSignals(consent: ConsentState) {
  return {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: consent.analytics ? 'granted' : 'denied',
  };
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

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = (...args: unknown[]) => {
    window.dataLayer?.push(args);
  };

  window.gtag('consent', 'default', consentSignals(consent));
  updateDataLayerConsent(consent);
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${analyticsConfig.gtmId}`;
  document.head.append(script);
  gtmLoaded = true;
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
    return;
  }

  if (!isAnalyticsHost(window.location.hostname, window.location.search)) return;

  if (!gtmLoaded) {
    loadGtm(consent);
  } else {
    updateDataLayerConsent(consent);
  }

  if (!consent.analytics) clearAnalyticsCookies();
}

export function trackEvent(name: string, params: Record<string, string> = {}): void {
  const consent = currentConsent ?? readConsent();
  if (!consent?.analytics || !gtmLoaded) return;
  window.dataLayer?.push({ event: name, ...params });
}

function handleClick(event: MouseEvent): void {
  const target = (event.target as Element | null)?.closest<HTMLElement>('[data-analytics-event]');
  if (!target) return;

  const name = target.dataset.analyticsEvent;
  if (!name) return;

  const params: Record<string, string> = {};
  const game = target.dataset.game;
  if (game) params.game = game;
  trackEvent(name, params);
}

export function initAnalytics(): void {
  if (!isAnalyticsHost(window.location.hostname, window.location.search)) return;
  if (!trackingInitialized) {
    document.addEventListener('click', handleClick);
    trackingInitialized = true;
  }

  const consent = readConsent();
  if (consent) applyConsent(consent);
}
