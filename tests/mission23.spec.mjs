import {test,expect} from './fixtures.mjs';
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
for(const base of ['/','/homolog/'])test(`Mission 23 em ${base}: duas imagens inteiras, controle remoto e cadastro`,async({page},info)=>{
 await page.clock.setFixedTime(new Date('2026-11-02T12:00:00Z'));const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.locator('.day[data-date="2026-11-02"]').click();
 for(let i=1;i<=2;i++){
  await expect(page.locator('.slide-count')).toHaveText(`${i} / 2`);const img=page.locator('.workout-poster');await expect.poll(()=>img.evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);
  const src=await img.getAttribute('src'),res=await page.request.get(src);const hash=b=>createHash('sha256').update(b).digest('hex');expect(hash(await res.body())).toBe(hash(readFileSync(`assets/posters/2026-11-02-crossfit-${i}.png`)));
  expect(await img.evaluate(e=>{const r=e.getBoundingClientRect(),h=document.querySelector('.tv-header').getBoundingClientRect(),f=document.querySelector('.poster-controls').getBoundingClientRect();return getComputedStyle(e).objectFit==='contain'&&r.top>=h.bottom&&r.bottom<=f.top&&document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight;})).toBe(true);
  await page.screenshot({path:`output/mission23-${base==='/'?'production':'homolog'}-${info.project.name}-${i}.png`});if(i===1)await page.keyboard.press('ArrowRight');
 }
 await page.keyboard.press('ArrowLeft');await expect(page.locator('.slide-count')).toHaveText('1 / 2');await page.keyboard.press('Backspace');await page.locator('.add-workout[data-date="2026-11-02"]').click();await expect(page).toHaveURL(new RegExp(`${base}editor.html`));await expect(page.locator('.env')).toHaveText(base==='/'?'PRODUÇÃO':'HOMOLOGAÇÃO');expect(errors).toEqual([]);
});
