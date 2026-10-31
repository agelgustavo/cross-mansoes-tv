import {test,expect} from '@playwright/test';
test('31/10: três artes completas, calendário, botões e controle remoto',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.locator('.day[data-date="2026-10-31"]').click();
 for(let i=1;i<=3;i++){
  await expect(page.locator('.slide-count')).toHaveText(`${i} / 3`);
  const img=page.locator('.workout-poster');
  await expect(img).toHaveAttribute('src',`./assets/posters/2026-10-31-crossfit-${i}.png`);
  await expect.poll(()=>img.evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);
  expect(await img.evaluate(e=>{
   const r=e.getBoundingClientRect(),h=document.querySelector('.tv-header').getBoundingClientRect(),f=document.querySelector('.poster-controls').getBoundingClientRect();
   return getComputedStyle(e).objectFit==='contain'&&r.top>=h.bottom&&r.bottom<=f.top&&document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight;
  })).toBe(true);
  await page.screenshot({path:`output/halloween-${info.project.name}-${i}.png`});
  if(i===1)await page.locator('[data-action="next"]').click();
  if(i===2)await page.keyboard.press('ArrowRight');
 }
 await page.keyboard.press('ArrowLeft');await expect(page.locator('.slide-count')).toHaveText('2 / 3');
 await page.locator('[data-action="previous"]').click();await expect(page.locator('.slide-count')).toHaveText('1 / 3');
 await page.keyboard.press('Backspace');await expect(page.locator('.calendar')).toBeVisible();
 expect(errors).toEqual([]);
});
