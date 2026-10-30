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
 const rect=await img.boundingBox();expect(rect.width).toBe(page.viewportSize().width);expect(rect.height).toBe(page.viewportSize().height);
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
