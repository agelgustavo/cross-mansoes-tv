import { test, expect } from '@playwright/test';
const DAY = '.day[data-date="2026-10-29"]';

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.calendar')).toBeVisible();
  await expect(page.locator(DAY).locator('.dot')).toHaveCount(2);
  await expect(page.locator('.version')).toContainText('v2.1.0');
  page.__errors = errors;
});
test.afterEach(async ({ page }) => { expect(page.__errors || []).toEqual([]); });

test('calendário abre modalidades com clique real', async ({ page }) => {
  await page.locator(DAY).click();
  await expect(page.getByRole('heading', { name: /ESCOLHA A MODALIDADE/i })).toBeVisible();
  await expect(page.locator('.choice')).toHaveCount(2);
});
test('CrossFit abre treino e permite avançar, voltar e retornar ao calendário', async ({ page }) => {
  await page.locator(DAY).click();
  await page.locator('[data-program="crossfit"]').click();
  await expect(page.locator('.slidehead')).toContainText('AQUECIMENTO');
  await expect(page.locator('.slide-title')).toContainText('Zuko');
  await page.getByRole('button', { name: /PRÓXIMA/i }).click();
  await expect(page.locator('.slidehead')).toContainText('SKILL / STRENGTH');
  await page.getByRole('button', { name: /ANTERIOR/i }).click();
  await expect(page.locator('.slidehead')).toContainText('AQUECIMENTO');
  await page.locator('[data-action="home"]').click();
  await expect(page.locator('.calendar')).toBeVisible();
});
test('controle remoto: OK, setas e voltar', async ({ page }) => {
  await page.locator(DAY).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.choice')).toHaveCount(2);
  await page.locator('[data-program="hybrid"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.slide-title')).toContainText('APPA');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.slidehead')).toContainText('ADAPTAÇÕES');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.slidehead')).toContainText('WOD');
  await page.keyboard.press('Backspace');
  await expect(page.locator('.calendar')).toBeVisible();
});
test('dia sem programação informa ausência, em vez de ignorar o clique', async ({ page }) => {
  await page.locator('.day[data-date="2026-10-28"]').click();
  await expect(page.locator('main')).toContainText('SEM TREINO PUBLICADO');
  await page.locator('[data-action="home"]').click();
  await expect(page.locator('.calendar')).toBeVisible();
});
test('relógio aparece e aguenta troca de telas', async ({ page }) => {
  await expect(page.locator('#clock')).toContainText(/^\d\d:\d\d$/);
  await page.locator(DAY).click();
  await expect(page.locator('#clock')).toContainText(/^\d\d:\d\d$/);
});
test('preserva dados em cache quando atualização do índice falha', async ({ page }) => {
  await page.route('**/data/index.json?*', route => route.abort());
  await page.reload();
  await expect(page.locator('.calendar')).toBeVisible();
  await expect(page.locator(DAY).locator('.dot')).toHaveCount(2);
  await page.locator(DAY).click();
  await expect(page.locator('.choice')).toHaveCount(2);
});

test('uma página por seção, com todo o aquecimento e adaptações', async ({page}) => {
  await page.locator(DAY).click();
  await page.locator('[data-program="crossfit"]').click();
  await expect(page.locator('.count')).toContainText('1 / 4');
  await expect(page.locator('.slide')).toContainText(/alternating samson lunges/i);
  await expect(page.locator('.slide')).toContainText(/thrusters \(aumentando a carga gradualmente\)/i);
  await page.getByRole('button',{name:/PRÓXIMA/i}).click();
  await expect(page.locator('.count')).toContainText('2 / 4');
  await page.getByRole('button',{name:/PRÓXIMA/i}).click();
  await expect(page.locator('.count')).toContainText('3 / 4');
  await page.getByRole('button',{name:/PRÓXIMA/i}).click();
  await expect(page.locator('.count')).toContainText('4 / 4');
  await expect(page.locator('.adaptation-card')).toHaveCount(2);
});
test('gorila do usuário aparece como ícone carregado', async ({page}) => {
  const logo=page.locator('.brand img.brand-icon');
  await expect(logo).toBeVisible();
  await expect.poll(()=>logo.evaluate(img=>img.complete && img.naturalWidth>0 && img.naturalHeight>0)).toBe(true);
});
