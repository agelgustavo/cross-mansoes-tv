import {test,expect} from '@playwright/test';
test('capturas de todas as etapas',async({page},info)=>{
 await page.goto('/');
 for(const mode of ['crossfit','hybrid']){
 await page.locator('.day[data-date="2026-10-29"]').click();
 await page.locator(`[data-program="${mode}"]`).click();
 await expect(page.locator('.board-inner')).toBeVisible();
 await page.evaluate(async()=>{const i=new Image();i.src='assets/tv-characters.png';await i.decode();});
 const total=Number((await page.locator('.slide-count').textContent()).split('/')[1]);
 for(let n=0;n<total;n++){
 await page.screenshot({path:`output/${info.project.name}-${mode}-${n}.png`});
 await page.keyboard.press('ArrowRight');
 }
 await page.keyboard.press('Escape');
 }
});
