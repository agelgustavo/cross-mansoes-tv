import {test,expect} from '@playwright/test';
test('artes completas, navegação direta e imagens carregadas',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 for(const mode of ['crossfit']){
 await page.locator('.day[data-date="2026-10-30"]').click();

 await expect(page.locator('.workout-poster')).toBeVisible();
 const total=Number((await page.locator('.slide-count').textContent()).split('/')[1]);
 expect(total).toBe(4);
 for(let n=0;n<total;n++){
 const img=page.locator('.workout-poster');
 await expect(img).toHaveJSProperty('complete',true);
 expect(await img.evaluate(i=>i.naturalWidth)).toBeGreaterThan(1000);
 const rect=await img.boundingBox();expect(rect.width).toBe(page.viewportSize().width);expect(rect.height).toBe(page.viewportSize().height-98);await expect(page.locator('.tv-header')).toBeVisible();await expect(page.locator('.poster-controls')).toHaveCSS('opacity','1');
 expect(await img.evaluate(i=>getComputedStyle(i).objectFit)).toBe('contain');
 await page.screenshot({path:`output/${info.project.name}-${mode}-${n}.png`});
 await page.keyboard.press('ArrowRight');
 }
 await expect(page.locator('.slide-count')).toHaveText(`${total} / ${total}`);
 await page.keyboard.press('ArrowLeft');await expect(page.locator('.slide-count')).toHaveText(`${total-1} / ${total}`);
 await page.keyboard.press('Escape');await expect(page.locator('.calendar')).toBeVisible();
 }
 expect(errors).toEqual([]);
});

test('controle com nomes antigos e apenas keyup, sem avanço duplicado',async({page})=>{
 await page.goto('/');await page.locator('.day[data-date="2026-10-30"]').click();
 await expect(page.locator('.poster-controls [data-action="next"]')).toBeFocused();
 await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keyup',{key:'Right',cancelable:true})));
 await expect(page.locator('.slide-count')).toHaveText('2 / 4');
 await page.keyboard.press('ArrowRight');await expect(page.locator('.slide-count')).toHaveText('3 / 4');
 await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keyup',{key:'Left',cancelable:true})));
 await expect(page.locator('.slide-count')).toHaveText('2 / 4');
});
test('calendário cabe na tela e usa logo oficial',async({page},info)=>{
 await page.goto('/');await expect(page.locator('.day[data-date="2026-10-30"]')).toContainText('CrossFit');
 await expect(page.locator('.brand-icon')).toHaveAttribute('src','./assets/simbolo_mansoes_vermelho.png');
 const r=await page.locator('.calendar').boundingBox();expect(r.y+r.height).toBeLessThan(page.viewportSize().height);
 await page.screenshot({path:`output/calendar-${info.project.name}.png`});
});

test('alternar aulas mantém a página de cada modalidade',async({page})=>{
 await page.goto('/');await page.locator('.day[data-date="2026-10-29"]').click();await page.locator('[data-program="crossfit"]').click();
 await page.keyboard.press('ArrowRight');const before=await page.locator('.slide-count').textContent();
 await page.locator('[data-action="switch-program"]').click();await expect(page.locator('.mode-chip')).toHaveText('Hybrid Run');
 await page.locator('[data-action="switch-program"]').click();await expect(page.locator('.mode-chip')).toHaveText('CrossFit');
 await expect(page.locator('.slide-count')).toHaveText(before);
 const prev=await page.locator('[data-action="previous"]').boundingBox(),next=await page.locator('[data-action="next"]').boundingBox();expect(next.x-prev.x-prev.width).toBeLessThanOrEqual(8);
});
test('células exibem duas modalidades em 1280x720 e seis semanas',async({page})=>{
 await page.setViewportSize({width:1280,height:720});await page.goto('/');
 const day=page.locator('.day[data-date="2026-10-29"]');await expect(day).toContainText('Hybrid Run');
 const box=await day.boundingBox();for(const chip of await day.locator('.chip').all()){const r=await chip.boundingBox();expect(r.y+r.height).toBeLessThanOrEqual(box.y+box.height);expect(r.x+r.width).toBeLessThanOrEqual(box.x+box.width);}
 await page.locator('[data-action="month"][data-step="-1"]').click();await page.locator('[data-action="month"][data-step="-1"]').click();
 await expect(page.locator('.calendar .day')).toHaveCount(42);
 const grid=await page.locator('.calendar').boundingBox();expect(grid.y+grid.height).toBeLessThanOrEqual(720);
});

test('alternador sempre visível no rodapé, indisponível sem treino',async({page})=>{
 await page.goto('/');await page.locator('.day[data-date="2026-10-30"]').click();
 const button=page.locator('.poster-controls [data-action="switch-program"]');
 await expect(button).toBeVisible();await expect(button).toBeDisabled();await expect(button).toContainText('Hybrid Run');await expect(button).toContainText('Sem treino nesta data');
 const box=await button.boundingBox();expect(box.x+box.width).toBeLessThanOrEqual(page.viewportSize().width);expect(box.y+box.height).toBeLessThanOrEqual(page.viewportSize().height);
 await page.screenshot({path:`output/switch-footer-${page.viewportSize().width}.png`});
});

test('cabeçalho e controles fixos iguais em arte e HTML',async({page})=>{
 await page.goto('/');await page.locator('.day[data-date="2026-10-30"]').click();
 const header=await page.locator('.tv-header').boundingBox();
 const footer=await page.locator('.poster-controls').boundingBox();
 const actions=await page.locator('.poster-controls button').evaluateAll(nodes=>nodes.map(n=>n.dataset.action));
 await page.locator('.poster-controls [data-action="home"]').click();
 await page.locator('.day[data-date="2026-10-29"]').click();await page.locator('[data-program="crossfit"]').click();
 for(const mode of ['CrossFit','Hybrid Run']){
  await expect(page.locator('.mode-chip')).toHaveText(mode);
  expect(await page.locator('.tv-header').boundingBox()).toEqual(header);
  expect(await page.locator('.poster-controls').boundingBox()).toEqual(footer);
  expect(await page.locator('.poster-controls button').evaluateAll(nodes=>nodes.map(n=>n.dataset.action))).toEqual(actions);
  await page.screenshot({path:`output/shared-${mode}-${page.viewportSize().width}.png`});
  await page.keyboard.press('ArrowRight');
  expect(await page.locator('.poster-controls').boundingBox()).toEqual(footer);
  if(mode==='CrossFit')await page.locator('[data-action="switch-program"]').click();
 }
});
