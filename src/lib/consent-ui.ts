import { applyConsent } from './analytics';
import { createConsent, readConsent, writeConsent, type ConsentState } from './consent';

let current: ConsentState | null = null;

export function initConsentUi(): void {
  const banner = document.querySelector<HTMLElement>('[data-consent-banner]');
  const dialog = document.querySelector<HTMLDialogElement>('[data-consent-dialog]');
  const analyticsInput = document.querySelector<HTMLInputElement>(
    '[data-consent-category="analytics"]',
  );
  const improvementInput = document.querySelector<HTMLInputElement>(
    '[data-consent-category="improvement"]',
  );

  if (!banner || !dialog || !analyticsInput || !improvementInput) return;

  const bannerElement = banner;
  const dialogElement = dialog;
  const analyticsElement = analyticsInput;
  const improvementElement = improvementInput;

  current = readConsent();
  if (current) {
    bannerElement.hidden = true;
    applyConsent(current);
  } else {
    bannerElement.hidden = false;
    requestAnimationFrame(() => bannerElement.querySelector<HTMLElement>('button')?.focus());
  }

  function syncInputs(consent: ConsentState | null): void {
    analyticsElement.checked = consent?.analytics ?? false;
    improvementElement.checked = consent?.improvement ?? false;
  }

  function openPreferences(): void {
    syncInputs(current);
    if (!dialogElement.open) dialogElement.showModal();
  }

  function closePreferences(): void {
    if (dialogElement.open) dialogElement.close();
  }

  function save(analytics: boolean, improvement: boolean): void {
    current = createConsent({ analytics, improvement });
    writeConsent(current);
    bannerElement.hidden = true;
    closePreferences();
    applyConsent(current);
  }

  document.addEventListener('click', (event) => {
    const target = (event.target as Element | null)?.closest<HTMLElement>('[data-consent-action]');
    if (!target) return;

    const action = target.dataset.consentAction;
    if (!action) return;

    event.preventDefault();

    if (action === 'accept') save(true, true);
    if (action === 'reject') save(false, false);
    if (action === 'preferences') openPreferences();
    if (action === 'close') closePreferences();
    if (action === 'save') save(analyticsElement.checked, improvementElement.checked);
  });
}
