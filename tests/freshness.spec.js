import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const original=JSON.parse(readFileSync(new URL('../dist/data/live-content.json',import.meta.url)));
function changed(){const value=structuredClone(original);value.site.news.title='自動更新のお知らせ';value.site.daily.price=777;value.site.daily.schedule[0].items=['自動更新のおかず'];value.menu.items[0].price=1234;value.menu.options.oomori.price=99;return value;}

test.describe('開いた画面の情報更新',()=>{
 test.use({serviceWorkers:'block'});
 test('60秒の確認で価格・日替わり・大盛りが変わり、スクロールと画像操作を保つ',async({page})=>{
  await page.clock.install();let content=original;const urls=[];
  await page.route('**/data/live-content.json?*',route=>{urls.push(route.request().url());return route.fulfill({json:content});});
  await page.goto('/menu.html#daily');await expect(page.locator('#daily-price')).toContainText(String(original.site.daily.price));
  await page.clock.runFor(1500);await page.evaluate(()=>window.scrollTo(0,700));const y=await page.evaluate(()=>scrollY);
  content=changed();await page.clock.fastForward(60000);
  await expect(page.locator('#daily-price')).toContainText('777');await expect(page.locator('#daily-schedule')).toContainText('自動更新のおかず');
  await expect(page.locator('#kanban-content')).toContainText('1,234');
  for(const element of await page.locator('[data-extra-price]').all())await expect(element).toHaveText('+¥99');
  expect(await page.evaluate(()=>scrollY)).toBeCloseTo(y,0);expect(new Set(urls).size).toBe(urls.length);
  await page.locator('#kanban-content .lightbox-trigger').first().click();await expect(page.locator('#lightbox')).toHaveClass(/active/);
  await page.keyboard.press('Escape');await expect(page.locator('#lightbox')).not.toHaveClass(/active/);
 });
 test('タブ復帰でお知らせが変わり、変更なしではDOMやティッカー複製が増えない',async({page})=>{
  let content=original;await page.route('**/data/live-content.json?*',route=>route.fulfill({json:content}));
  await page.goto('/');await expect(page.locator('#ticker-title')).toHaveText(original.site.news.title);
  content=changed();await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await expect(page.locator('#ticker-title')).toHaveText('自動更新のお知らせ');await expect(page.locator('#kanban-price')).toContainText('1,234');
  expect(await page.locator('[data-ticker-clone]').allTextContents()).toEqual(expect.arrayContaining([expect.stringContaining('自動更新のお知らせ')]));
  const count=await page.locator('[data-ticker-clone]').count();await page.evaluate(()=>document.querySelector('#ticker-title').dataset.preserved='yes');
  await Promise.all([page.waitForResponse('**/data/live-content.json?*'),page.evaluate(()=>window.dispatchEvent(new Event('focus')))]);
  await expect(page.locator('#ticker-title')).toHaveAttribute('data-preserved','yes');await expect(page.locator('[data-ticker-clone]')).toHaveCount(count);
 });
 test('通信失敗・不正なデータでは古い可能性を表示し、再接続で回復する',async({page})=>{
  let state='ok';await page.route('**/data/live-content.json?*',route=>state==='offline'?route.abort():route.fulfill({json:state==='bad'?{}:state==='new'?changed():original}));
  await page.goto('/menu.html');await expect(page.locator('#daily-price')).toContainText(String(original.site.daily.price));
  for(const next of ['offline','bad']){state=next;await page.evaluate(()=>window.dispatchEvent(new Event('online')));await expect(page.locator('#content-freshness-notice')).toContainText('古い可能性');await expect(page.locator('#daily-price')).toContainText(String(original.site.daily.price));}
  state='new';await page.evaluate(()=>window.dispatchEvent(new Event('online')));await expect(page.locator('#daily-price')).toContainText('777');await expect(page.locator('#content-freshness-notice')).toHaveCount(0);
 });
});

test('実際のService Workerに古いデータを保存しても使用せず、オフラインを案内する',async({page,context})=>{
 const networkUrls=[];context.on('request',request=>networkUrls.push(request.url()));
 await page.goto('/menu.html');await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
 await expect(page.locator('#daily-price')).toContainText(String(original.site.daily.price));
 expect(networkUrls.some(url=>url.includes('/menu.html?_fresh='))).toBe(true);
 await page.evaluate(async payload=>{const cache=await caches.open('tetsujin-bento-stale-test');await cache.put('/data/live-content.json',new Response(JSON.stringify(payload),{headers:{'Content-Type':'application/json'}}));},changed());
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(page.locator('#daily-price')).toContainText(String(original.site.daily.price));
 await context.setOffline(true);await page.evaluate(()=>window.dispatchEvent(new Event('online')));await expect(page.locator('#content-freshness-notice')).toContainText('古い可能性');
 await context.setOffline(false);await page.evaluate(()=>window.dispatchEvent(new Event('online')));await expect(page.locator('#content-freshness-notice')).toHaveCount(0);
});
