import {test,expect} from '@playwright/test';
const DAY='.day[data-date="2026-10-29"]';
async function fit(page){
  const data=await page.locator('.board').evaluate(el=>{
    const inner=el.querySelector('.board-inner');
    const cards=[...el.querySelectorAll('.training-card,.movement-tile,.kpi-card')];
    return {width:inner.scrollWidth-inner.clientWidth,height:inner.scrollHeight-inner.clientHeight,
      cards:cards.map(n=>({w:n.scrollWidth-n.clientWidth,h:n.scrollHeight-n.clientHeight})),warning:el.classList.contains('fit-warning')};
  });
  expect(data.warning).toBe(false);
  expect(data.width).toBeLessThanOrEqual(3);
  expect(data.height).toBeLessThanOrEqual(3);
  for(const card of data.cards){expect(card.w).toBeLessThanOrEqual(3);expect(card.h).toBeLessThanOrEqual(3);}
}
test.beforeEach(async({page})=>{
  page.__errors=[];
  page.on('pageerror',e=>page.__errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('.version')).toContainText('v4.1.0');
  await expect(page.locator(DAY)).toContainText('Hybrid Run');
});
test.afterEach(async({page})=>{expect(page.__errors).toEqual([]);});
test('calendário exibe modalidades e permite clique real',async({page})=>{
  await expect(page.locator(DAY)).toContainText('CrossFit');
  await expect(page.locator(DAY).locator('.dot')).toHaveCount(2);
  await page.locator(DAY).click();
  await expect(page.locator('.choice')).toHaveCount(2);
});
test('CrossFit: todas as seções, score, duração e sem cortes',async({page})=>{
  await page.locator(DAY).click();await page.locator('[data-program="crossfit"]').click();
  const names=['AQUECIMENTO','SKILL / STRENGTH','WOD','ADAPTAÇÕES','OPTIONAL ACCESSORY'];
  for(let i=0;i<names.length;i++){
    await expect(page.locator('.slide-eyebrow')).toContainText(names[i]);
    await fit(page);
    if(i===0){await expect(page.locator('.board')).toContainText(/samson lunges/i);await expect(page.locator('.board')).toContainText(/carga gradualmente/i);}
    if(i===2){await expect(page.locator('.format-item')).toContainText('EVERY 3:00 | 6 SETS');await expect(page.locator('.kpi-grid')).toContainText(/tempo do pior round/i);}
    if(i===3){await expect(page.locator('.adapt-card')).toHaveCount(2);await expect(page.locator('.board')).toContainText(/42,5\/30 kg/i);}
    if(i<names.length-1)await page.locator('[data-action="next"]').click();
  }
});
test('Hybrid Run: dois blocos, score, time cap e adaptações paginadas',async({page})=>{
  await page.locator(DAY).click();await page.locator('[data-program="hybrid"]').click();
  await expect(page.locator('.movement-tile')).toHaveCount(6);
  await expect(page.locator('.wod-block')).toHaveCount(2);
  await expect(page.locator('.kpi-grid')).toContainText("60'");await fit(page);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.adapt-card')).toHaveCount(4);await fit(page);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.adapt-card')).toHaveCount(2);await fit(page);
  await expect(page.locator('.board')).toContainText('RX / INT / SC: 200 m');
  await page.keyboard.press('Backspace');await expect(page.locator('.calendar')).toBeVisible();
});
test('controle remoto: Enter e setas, retorno ao calendário',async({page})=>{
  await page.locator(DAY).focus();await page.keyboard.press('Enter');
  await page.locator('[data-program="crossfit"]').focus();await page.keyboard.press('Enter');
  await expect(page.locator('.slide-eyebrow')).toContainText('AQUECIMENTO');
  await page.keyboard.press('ArrowRight');await expect(page.locator('.slide-eyebrow')).toContainText('SKILL');
  await page.keyboard.press('ArrowLeft');await expect(page.locator('.slide-eyebrow')).toContainText('AQUECIMENTO');
  await page.keyboard.press('Backspace');await expect(page.locator('.calendar')).toBeVisible();
});
test('data sem treino e navegação de meses não quebram',async({page})=>{
  await page.locator('.day[data-date="2026-10-28"]').click();
  await expect(page.locator('.error-panel')).toContainText(/Sem treino publicado/i);
  await page.locator('[data-action="home"]').click();
  await page.locator('[data-action="month"][data-step="1"]').click();
  await expect(page.locator('.toolbar')).toContainText('novembro');
});
test('calendário usa no máximo 5 semanas em outubro de 2026',async({page})=>{
  await expect(page.locator('.calendar .day')).toHaveCount(35);
});

test('WOD único tem layout centralizado, sem painéis artificiais',async({page})=>{
  await page.locator(DAY).click();await page.locator('[data-program="crossfit"]').click();
  await page.locator('[data-action="next"]').click();
  await page.locator('[data-action="next"]').click();
  await expect(page.locator('.slide-eyebrow')).toContainText('WOD');
  await expect(page.locator('.wod-single')).toHaveCount(1);
  await expect(page.locator('.wod-block')).toHaveCount(0);
  await expect(page.locator('.movement-tile')).toHaveCount(2);
  await fit(page);
});
test('adaptações têm fontes próprias para leitura à distância',async({page})=>{
  await page.locator(DAY).click();await page.locator('[data-program="crossfit"]').click();
  for(let i=0;i<3;i++)await page.locator('[data-action="next"]').click();
  const sizes=await page.locator('.adapt-row').first().evaluate(el=>{
    const category=el.querySelector('.adapt-category');
    const description=el.querySelector('span:last-child');
    return {category:parseFloat(getComputedStyle(category).fontSize),description:parseFloat(getComputedStyle(description).fontSize)};
  });
  const small=page.viewportSize().height<=850;
  expect(sizes.category).toBeGreaterThanOrEqual(small?26:34);
  expect(sizes.description).toBeGreaterThanOrEqual(small?22:28);
  await fit(page);
});
