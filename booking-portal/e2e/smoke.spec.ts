import { expect, test } from '@playwright/test';

test('la página de inicio muestra su título', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
