import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function assertNoContrastViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
  expect(results.violations).toEqual([]);
}

const CONSENT = {
  version: 1,
  analytics: false,
  improvement: false,
  marketing: false,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

test('cookies sin violaciones de contraste con el banner visible', async ({ page }) => {
  await page.goto('/cookies/');
  await expect(page.locator('[data-consent-banner]')).toBeVisible();
  await assertNoContrastViolations(page);
});

test('cookies sin violaciones de contraste sin el banner', async ({ page }) => {
  await page.addInitScript((consent) => {
    localStorage.setItem('pyloncito:consent:v1', consent);
  }, JSON.stringify(CONSENT));
  await page.goto('/cookies/');
  await expect(page.locator('[data-consent-banner]')).toBeHidden();
  await assertNoContrastViolations(page);
});
