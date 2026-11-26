import { expect, test } from '@playwright/test';

test('el flujo simulado conserva la reserva y el pago en local', async ({ page }) => {
  await page.goto('/mibarberia503');
  const service = page.getByRole('button', { name: /Corte Clásico/ });
  const next = page.getByRole('button', { name: 'Continuar' });
  await expect(async () => {
    if (!(await next.isEnabled())) await service.click();
    await expect(next).toBeEnabled({ timeout: 500 });
  }).toPass({ timeout: 15_000 });
  await next.click();
  const slots = page.getByRole('region', { name: 'Horarios disponibles' }).getByRole('button');
  await expect(slots.first()).toBeVisible();
  await slots.first().click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByLabel('Nombre completo').fill('Ana Pérez');
  await page.getByLabel('Teléfono (WhatsApp / SMS)').fill('+503 7000 0000');
  await page.getByLabel('Correo electrónico').fill('ana@example.test');
  await page.getByRole('button', { name: 'Confirmar reserva', exact: true }).click();
  await page.getByRole('button', { name: /Pagar en el local/ }).click();
  await page.getByRole('button', { name: 'Confirmar reserva (pago en local)' }).click();
  await expect(page.getByRole('heading', { name: '¡Cita confirmada!' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver o cancelar mi cita' })).toBeVisible();
});
