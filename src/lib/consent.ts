import { analyticsConfig } from '../config/analytics';
import type { StorageLike } from './storage';

export const CONSENT_VERSION = 1;

export interface ConsentState {
  version: 1;
  analytics: boolean;
  improvement: boolean;
  marketing: boolean;
  updatedAt: string;
}

export const defaultConsent: ConsentState = {
  version: CONSENT_VERSION,
  analytics: false,
  improvement: false,
  marketing: false,
  updatedAt: '',
};

export function createConsent(
  values: Pick<ConsentState, 'analytics' | 'improvement'> & { marketing?: boolean },
): ConsentState {
  return {
    version: CONSENT_VERSION,
    analytics: values.analytics,
    improvement: values.improvement,
    marketing: values.marketing ?? false,
    updatedAt: new Date().toISOString(),
  };
}

export function parseConsent(value: unknown): ConsentState | null {
  if (typeof value !== 'object' || value === null) return null;
  const candidate = value as Partial<ConsentState>;
  if (candidate.version !== CONSENT_VERSION) return null;
  if (typeof candidate.analytics !== 'boolean') return null;
  if (typeof candidate.improvement !== 'boolean') return null;
  if (typeof candidate.marketing !== 'boolean') return null;
  if (typeof candidate.updatedAt !== 'string' || candidate.updatedAt === '') return null;

  return {
    version: CONSENT_VERSION,
    analytics: candidate.analytics,
    improvement: candidate.improvement,
    marketing: candidate.marketing,
    updatedAt: candidate.updatedAt,
  };
}

function safeStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readConsent(storage: StorageLike | null = safeStorage()): ConsentState | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(analyticsConfig.consentKey);
    if (!raw) return null;
    return parseConsent(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeConsent(
  consent: ConsentState,
  storage: StorageLike | null = safeStorage(),
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(analyticsConfig.consentKey, JSON.stringify(consent));
    return true;
  } catch {
    return false;
  }
}

export function shouldLoadGtm(consent: ConsentState): boolean {
  return consent.analytics;
}
