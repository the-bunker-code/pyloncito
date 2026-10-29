import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ applyConsent: vi.fn() }));
vi.mock('../../src/lib/analytics', () => ({ applyConsent: mocks.applyConsent }));

const CONSENT_KEY = 'pyloncito:consent:v1';

function buildDom(): void {
  document.body.innerHTML = `
    <section data-consent-banner hidden tabindex="-1">
      <button data-consent-action="accept">Aceptar</button>
      <button data-consent-action="reject">Rechazar</button>
      <button data-consent-action="preferences">Preferencias</button>
    </section>
    <dialog data-consent-dialog>
      <button data-consent-action="close">Cerrar</button>
      <input type="checkbox" data-consent-category="analytics" />
      <input type="checkbox" data-consent-category="improvement" />
      <button data-consent-action="save">Guardar</button>
    </dialog>
  `;
  const dialog = document.querySelector<HTMLDialogElement>('[data-consent-dialog]');
  if (dialog) {
    dialog.showModal = vi.fn(() => {
      dialog.open = true;
    });
    dialog.close = vi.fn(() => {
      dialog.open = false;
    });
  }
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0);
    return 0;
  });
}

function click(action: string): void {
  document.querySelector<HTMLElement>(`[data-consent-action="${action}"]`)?.click();
}

describe('consent UI', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.style.removeProperty('--consent-banner-space');
    mocks.applyConsent.mockClear();
    buildDom();
  });

  it('does nothing when the banner is absent', async () => {
    document.body.innerHTML = '';
    const { initConsentUi } = await import('../../src/lib/consent-ui');
    expect(() => initConsentUi()).not.toThrow();
  });

  it('shows the banner when there is no decision', async () => {
    const { initConsentUi } = await import('../../src/lib/consent-ui');
    initConsentUi();
    const banner = document.querySelector<HTMLElement>('[data-consent-banner]');
    expect(banner?.hidden).toBe(false);
    expect(document.documentElement.classList.contains('has-cookie-banner')).toBe(true);
    expect(mocks.applyConsent).not.toHaveBeenCalled();
  });

  it('accepts all and persists the decision', async () => {
    const { initConsentUi } = await import('../../src/lib/consent-ui');
    initConsentUi();
    click('accept');
    const stored = JSON.parse(localStorage.getItem(CONSENT_KEY) ?? 'null');
    expect(stored).toMatchObject({ analytics: true, improvement: true, marketing: false });
    expect(document.querySelector<HTMLElement>('[data-consent-banner]')?.hidden).toBe(true);
    expect(mocks.applyConsent).toHaveBeenCalledWith(
      expect.objectContaining({ analytics: true, improvement: true }),
    );
  });

  it('rejects and saves only the chosen categories', async () => {
    const { initConsentUi } = await import('../../src/lib/consent-ui');
    initConsentUi();
    click('preferences');
    const analytics = document.querySelector<HTMLInputElement>(
      '[data-consent-category="analytics"]',
    );
    if (analytics) analytics.checked = true;
    click('save');
    const stored = JSON.parse(localStorage.getItem(CONSENT_KEY) ?? 'null');
    expect(stored).toMatchObject({ analytics: true, improvement: false });
    expect(mocks.applyConsent).toHaveBeenCalled();
  });

  it('hides the banner and applies a stored decision', async () => {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({
        version: 1,
        analytics: true,
        improvement: false,
        marketing: false,
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
    );
    const { initConsentUi } = await import('../../src/lib/consent-ui');
    initConsentUi();
    expect(document.querySelector<HTMLElement>('[data-consent-banner]')?.hidden).toBe(true);
    expect(mocks.applyConsent).toHaveBeenCalledWith(expect.objectContaining({ analytics: true }));
  });

  it('opens and closes preferences', async () => {
    const { initConsentUi } = await import('../../src/lib/consent-ui');
    initConsentUi();
    const dialog = document.querySelector<HTMLDialogElement>('[data-consent-dialog]');
    click('preferences');
    expect(dialog?.open).toBe(true);
    click('close');
    expect(dialog?.open).toBe(false);
  });
});
