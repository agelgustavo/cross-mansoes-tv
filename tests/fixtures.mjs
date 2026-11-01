import {test as base,expect} from '@playwright/test';
export const test=base.extend({page:async({page},use)=>{await page.route('https://raw.githubusercontent.com/**/catalog.json*',route=>route.fulfill({json:{version:1,workouts:{}}}));await use(page);}});
export {expect};
