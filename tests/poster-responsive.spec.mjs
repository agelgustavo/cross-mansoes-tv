import {test,expect} from '@playwright/test';
for(const [width,height] of [[1920,1080],[3840,2160],[2048,1280],[3440,1440],[390,844],[844,390]]){
 test(`artwork layers fill ${width}x${height} without cropping`,async({page},info)=>{
  await page.setViewportSize({width,height});
  await page.goto('/');
  await page.locator('.day[data-date="2026-10-30"]').click();
  for(let slide=1;slide<=4;slide++){
   await expect(page.locator('.slide-count')).toHaveText(`${slide} / 4`);
   await expect.poll(()=>page.locator('.workout-poster').evaluate(i=>i.complete && i.naturalWidth>0)).toBe(true);
   const geometry=await page.evaluate(()=>{
    const main=document.querySelector('.workout-poster'),back=document.querySelector('.workout-backdrop'),stage=document.querySelector('.poster-stage');
    const m=main.getBoundingClientRect(),b=back.getBoundingClientRect(),s=stage.getBoundingClientRect();
    const scale=Math.min(m.width/main.naturalWidth,m.height/main.naturalHeight);
    return {same:main.src===back.src,fit:getComputedStyle(main).objectFit,backFit:getComputedStyle(back).objectFit,filter:getComputedStyle(back).filter,center:getComputedStyle(main).objectPosition,
     intact:m.x>=s.x && m.y>=s.y && m.right<=s.right && m.bottom<=s.bottom && main.naturalWidth*scale<=s.width+.01 && main.naturalHeight*scale<=s.height+.01,
     covered:b.left<s.left && b.top<s.top && b.right>s.right && b.bottom>s.bottom,
     scroll:document.documentElement.scrollWidth>innerWidth || document.documentElement.scrollHeight>innerHeight};
   });
   expect(geometry).toMatchObject({same:true,fit:'contain',backFit:'cover',center:'50% 50%',intact:true,covered:true,scroll:false});
   expect(geometry.filter).toContain('blur(');
   for(const control of await page.locator('.poster-controls button,.tv-header').all()){
    const r=await control.boundingBox();expect(r.x).toBeGreaterThanOrEqual(0);expect(r.y).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(width);expect(r.y+r.height).toBeLessThanOrEqual(height);
   }
   if(slide===1)await page.screenshot({path:`output/layers-${info.project.name}-${width}x${height}.png`});
   if(slide<4)await page.locator('[data-action="next"]').click();
  }
  await page.keyboard.press('ArrowLeft');await expect(page.locator('.slide-count')).toHaveText('3 / 4');
 });
}
