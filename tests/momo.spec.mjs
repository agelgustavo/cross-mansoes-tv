import {test,expect} from './fixtures.mjs';
test.beforeEach(async({page})=>{await page.clock.setFixedTime(new Date('2026-10-31T12:00:00Z'));});
test('01/11 Hybrid: WOD e adaptações completos com navegação na TV',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.locator('[data-action="month"][data-step="1"]').click();
 const day=page.locator('.day[data-date="2026-11-01"]');
 await expect(day).toContainText('Hybrid Run');await day.click();
 for(let i=1;i<=2;i++){
  await expect(page.locator('.slide-count')).toHaveText(`${i} / 2`);
  const img=page.locator('.workout-poster');
  await expect(img).toHaveAttribute('src',new URL(`./assets/posters/2026-11-01-hybrid-${i}.png`,page.url()).href);
  await expect.poll(()=>img.evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);
  expect(await img.evaluate(e=>{
   const r=e.getBoundingClientRect(),h=document.querySelector('.tv-header').getBoundingClientRect(),f=document.querySelector('.poster-controls').getBoundingClientRect();
   return getComputedStyle(e).objectFit==='contain'&&r.top>=h.bottom&&r.bottom<=f.top&&document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight;
  })).toBe(true);
  await expect(page.locator('[data-action="switch-program"]')).toBeDisabled();
  await page.screenshot({path:`output/momo-${info.project.name}-${i}.png`});
  if(i===1)await page.locator('[data-action="next"]').click();
 }
 await page.keyboard.press('ArrowLeft');await expect(page.locator('.slide-count')).toHaveText('1 / 2');
 await page.keyboard.press('ArrowRight');await expect(page.locator('.slide-count')).toHaveText('2 / 2');
 await page.locator('[data-action="previous"]').click();await expect(page.locator('.slide-count')).toHaveText('1 / 2');
 await page.keyboard.press('Backspace');await expect(page.locator('.calendar')).toBeVisible();
 expect(errors).toEqual([]);
});
