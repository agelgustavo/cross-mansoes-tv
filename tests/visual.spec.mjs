import {test,expect} from '@playwright/test';
test('artes completas, navegação direta e imagens carregadas',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 for(const mode of ['crossfit']){
 await page.locator('.day[data-date="2026-10-30"]').click();

 await expect(page.locator('.workout-poster')).toBeVisible();
 const total=Number((await page.locator('.slide-count').textContent()).split('/')[1]);
 expect(total).toBe(5);
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
 await expect(page.locator('.slide-count')).toHaveText('2 / 5');
 await page.keyboard.press('ArrowRight');await expect(page.locator('.slide-count')).toHaveText('3 / 5');
 await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keyup',{key:'Left',cancelable:true})));
 await expect(page.locator('.slide-count')).toHaveText('2 / 5');
});
test('calendário cabe na tela e usa logo oficial',async({page},info)=>{
 await page.goto('/');await expect(page.locator('.day[data-date="2026-10-30"]')).toContainText('CrossFit');
 await expect(page.locator('.brand-icon')).toHaveAttribute('src','./assets/simbolo_mansoes_vermelho.png');
 const r=await page.locator('.calendar').boundingBox();expect(r.y+r.height).toBeLessThan(page.viewportSize().height);
 await page.screenshot({path:`output/calendar-${info.project.name}.png`});
});
