import { test, expect } from '@playwright/test';

const DAY = '.day[data-date="2026-10-29"]';

async function assertBoardFits(page) {
  const board = page.locator('.board');
  await expect(board).toBeVisible();
  const metrics = await board.evaluate(node => ({
    clientHeight: node.clientHeight,
    scrollHeight: node.scrollHeight,
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth
  }));
  expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + 3);
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 3);
}

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.__errors = errors;
  await page.goto('/');
  await expect(page.locator('.calendar')).toBeVisible();
  await expect(page.locator('.version')).toContainText('v3.0.0');
});

test.afterEach(async ({ page }) => {
  expect(page.__errors || []).toEqual([]);
});

test('calendário mostra disponibilidade textual e abre modalidades', async ({ page }) => {
  const day = page.locator(DAY);
  await expect(day).toContainText('CrossFit');
  await expect(day).toContainText('Hybrid Run');
  await expect(day.locator('.dot')).toHaveCount(2);
  await day.click();
  await expect(page.getByRole('heading', { name: /Escolha a modalidade/i })).toBeVisible();
  await expect(page.locator('.choice')).toHaveCount(2);
});

test('CrossFit abre 4 seções e todas cabem na tela', async ({ page }) => {
  await page.locator(DAY).click();
  await page.locator('[data-program="crossfit"]').click();

  await expect(page.locator('.slide-eyebrow')).toContainText('AQUECIMENTO');
  await expect(page.locator('.slide-count')).toContainText('1 / 4');
  await expect(page.locator('.board')).toContainText(/alternating samson lunges/i);
  await expect(page.locator('.board')).toContainText(/thrusters \(aumentando a carga gradualmente\)/i);
  await assertBoardFits(page);

  await page.locator('[data-action="next"]').click();
  await expect(page.locator('.slide-eyebrow')).toContainText('SKILL / STRENGTH');
  await assertBoardFits(page);

  await page.locator('[data-action="next"]').click();
  await expect(page.locator('.slide-eyebrow')).toContainText('WOD');
  await assertBoardFits(page);

  await page.locator('[data-action="next"]').click();
  await expect(page.locator('.slide-eyebrow')).toContainText('ADAPTAÇÕES');
  await expect(page.locator('.adapt-card')).toHaveCount(2);
  await assertBoardFits(page);
});

test('Hybrid abre com teclado e navega entre WOD e adaptações', async ({ page }) => {
  await page.locator(DAY).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.choice')).toHaveCount(2);
  await page.locator('[data-program="hybrid"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.slide-title-row')).toContainText('APPA');
  await expect(page.locator('.slide-eyebrow')).toContainText('WOD');
  await assertBoardFits(page);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.slide-eyebrow')).toContainText('ADAPTAÇÕES');
  await assertBoardFits(page);
  await page.keyboard.press('Backspace');
  await expect(page.locator('.calendar')).toBeVisible();
});

test('dia sem programação abre estado vazio e não quebra o clique', async ({ page }) => {
  await page.locator('.day[data-date="2026-10-28"]').click();
  await expect(page.locator('main')).toContainText(/Sem treino publicado/i);
  await page.locator('[data-action="home"]').click();
  await expect(page.locator('.calendar')).toBeVisible();
});

test('refresh com falha de índice preserva calendário em cache', async ({ page }) => {
  await page.route('**/data/index.json?*', route => route.abort());
  await page.locator('[data-action="refresh"]').click();
  await expect(page.locator('.calendar')).toBeVisible();
  await page.locator(DAY).click();
  await expect(page.locator('.choice')).toHaveCount(2);
});
