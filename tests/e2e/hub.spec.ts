import { expect, test } from '@playwright/test';

test('el hub carga sin errores y sin scroll horizontal', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') problems.push(message.text());
  });
  page.on('pageerror', (error) => problems.push(error.message));

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pyloncito' })).toBeVisible();
  await expect(
    page.getByText('Cuatro juegos para mirar, contar, recordar y hablar.'),
  ).toBeVisible();
  await expect(page.locator('.game-card')).toHaveCount(4);
  await expect(page.getByText('Próximamente').first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Guía', exact: true })).toBeVisible();

  const hasHorizontalScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalScroll).toBe(false);
  expect(problems).toEqual([]);
});
