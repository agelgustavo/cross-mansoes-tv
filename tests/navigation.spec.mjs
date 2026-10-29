import { test, expect } from '@playwright/test';
test.beforeEach(async ({page})=>{await page.goto('/');await expect(page.locator('.calendar')).toBeVisible();});
test('relógio e calendário carregam',async ({page})=>{await expect(page.locator('#tv-clock')).toContainText(/\d{2}:\d{2}/);await expect(page.locator('.day[data-value="2026-10-29"]')).toBeVisible();});
test('clique leva às modalidades e às páginas do WOD',async ({page})=>{await page.locator('.day[data-value="2026-10-29"]').click();await expect(page.locator('.choice.crossfit')).toBeVisible();await page.locator('.choice.crossfit').click();await expect(page.locator('.slide-label')).toContainText('AQUECIMENTO');await page.locator('[data-act="next"]').click();await expect(page.locator('.slide-label')).toContainText('AQUECIMENTO');await page.locator('[data-act="home"]').click();await expect(page.locator('.calendar')).toBeVisible();});
test('controle remoto: setas, OK, próxima e voltar',async ({page})=>{await page.locator('.day[data-value="2026-10-29"]').focus();await page.keyboard.press('Enter');await expect(page.locator('.choice.crossfit')).toBeVisible();await page.locator('.choice.crossfit').focus();await page.keyboard.press('Enter');await expect(page.locator('.slide-label')).toContainText('AQUECIMENTO');await page.keyboard.press('ArrowRight');await expect(page.locator('.slide-label')).toContainText('AQUECIMENTO 2/3');await page.keyboard.press('ArrowLeft');await expect(page.locator('.slide-label')).toContainText('AQUECIMENTO 1/3');await page.keyboard.press('Backspace');await expect(page.locator('.calendar')).toBeVisible();});
test('Hybrid Run abre e apresenta WOD e adaptações',async ({page})=>{await page.locator('.day[data-value="2026-10-29"]').click();await page.locator('.choice.hybrid').click();await expect(page.locator('h1')).toContainText('APPA');await expect(page.locator('.slide-label')).toContainText('WOD');await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await expect(page.locator('.slide-label')).toContainText('ADAPTAÇÕES');});
test('nenhum erro JavaScript ao navegar',async ({page})=>{const errs=[];page.on('pageerror',e=>errs.push(e.message));await page.locator('.day[data-value="2026-10-29"]').click();await page.locator('.choice.crossfit').click();await page.keyboard.press('ArrowRight');await page.locator('[data-act="home"]').click();expect(errs).toEqual([]);});

test('regressão: dia 29 responde ao clique e abre CrossFit e Hybrid',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await expect(page.locator('#version')).toContainText('v1.1.0');
 await expect(page.locator('.day[data-value="2026-10-29"] .dot')).toHaveCount(2);
 await page.locator('.day[data-value="2026-10-29"]').click();
 await expect(page.getByRole('heading',{name:'Escolha a modalidade'})).toBeVisible();
 await expect(page.locator('.choice')).toHaveCount(2);
 await page.locator('.choice.crossfit').click();
 await expect(page.locator('.slide-label')).toContainText('AQUECIMENTO');
 expect(errors).toEqual([]);
});
test('regressão: iniciar sem índice não impede cliques do calendário',async({page})=>{
 await page.route('**/data/index.json',route=>route.abort());
 await page.goto('/');
 await expect(page.locator('.calendar')).toBeVisible();
 await page.locator('.day[data-value="2026-10-29"]').click();
 await expect(page.locator('h1')).toContainText('Nenhum treino publicado');
 await page.locator('[data-act="home"]').click();
 await expect(page.locator('.calendar')).toBeVisible();
});
