import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

// JSON差し替えテストはService Workerのネットワーク処理から分離する。
test.use({ serviceWorkers: 'block' });

const menu = JSON.parse(readFileSync(new URL('../public/data/menu.json', import.meta.url)));
const config = JSON.parse(readFileSync(new URL('../public/data/site-config.json', import.meta.url)));
const pages = ['index', 'menu', 'area', 'about', 'order', 'recruit', 'legal', 'privacy', '404'];

test('公開ページは外部JSとインライン実行を禁止し、通常操作でCSP違反がない', async ({ page }) => {
  await page.addInitScript(() => {
    window.securityViolations = [];
    document.addEventListener('securitypolicyviolation', event => window.securityViolations.push(`${event.effectiveDirective}: ${event.blockedURI}`));
  });
  for (const name of pages) {
    await page.goto(`/${name}.html`, { waitUntil: 'networkidle' });
    await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveAttribute('content', /script-src 'self';/);
    await expect(page.locator('script[src^="http"]')).toHaveCount(0);
    if (name === 'area') {
      await expect(page.locator('.leaflet-container')).toBeVisible();
      await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible();
      await page.locator('.leaflet-marker-icon').click();
      await expect(page.locator('.leaflet-popup-content')).toContainText('新橋店');
      await page.locator('.leaflet-control-zoom-in').click();
    }
    expect(await page.evaluate(() => window.securityViolations), name).toEqual([]);
  }
});

test('既存JSONの編集形式のまま、お知らせ・日替わり・商品価格を更新できる', async ({ page }) => {
  const updatedConfig = structuredClone(config);
  const updatedMenu = structuredClone(menu);
  updatedConfig.news.title = '更新確認のお知らせ';
  updatedConfig.daily.schedule[0].items = ['更新確認のおかず'];
  updatedConfig.daily.price = 750;
  updatedMenu.items.find(item => item.categoryId === 'kanban').price = 1234;
  await page.route('**/data/site-config.json', route => route.fulfill({ json: updatedConfig }));
  await page.route('**/data/menu.json', route => route.fulfill({ json: updatedMenu }));
  await page.goto('/');
  await expect(page.locator('#ticker-title').first()).toHaveText('更新確認のお知らせ');
  await expect(page.locator('#kanban-price')).toContainText('1,234');
  await page.goto('/menu.html');
  await expect(page.locator('#daily-price')).toContainText('750');
  await expect(page.locator('#daily-schedule')).toContainText('更新確認のおかず');
  await expect(page.locator('#kanban-content')).toContainText('1,234');
});

test('HTMLを含むデータはCSPに頼らず文字として表示する', async ({ page }) => {
  const updated = structuredClone(menu);
  const payload = '<img src=x onerror="window.injected=true">';
  const item = updated.items.find(item => item.categoryId === 'standard' && item.image);
  item.name = payload;
  item.description = payload;
  updated.items.find(item => item.categoryId === 'kanban').description = [payload];
  const updatedConfig = structuredClone(config);
  updatedConfig.daily.schedule[0].items = [payload];
  await page.route('**/menu.html', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, '') });
  });
  await page.route('**/data/menu.json', route => route.fulfill({ json: updated }));
  await page.route('**/data/site-config.json', route => route.fulfill({ json: updatedConfig }));
  await page.goto('/menu.html');
  await expect(page.locator('#standard-content')).toContainText(payload);
  await expect(page.locator('#kanban-content')).toContainText(payload);
  await expect(page.locator('#daily-schedule')).toContainText(payload);
  await expect(page.locator('img[onerror]')).toHaveCount(0);
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
});

test('不正なURLハッシュでも例外が発生しない', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/menu.html#%E0%A4%A', { waitUntil: 'networkidle' });
  await expect(page.locator('#standard-content .menu-card').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('生成物に旧CMS・Netlify連携・PHP・機密ファイルを含まない', async () => {
  const { readdirSync } = await import('node:fs');
  const files = readdirSync(new URL('../dist/', import.meta.url), { recursive: true }).map(String);
  expect(files.filter(name => /(^|\/)(admin|\.git|\.env)(\/|$)|\.php$/i.test(name))).toEqual([]);
  for (const name of pages) {
    expect(readFileSync(new URL(`../dist/${name}.html`, import.meta.url), 'utf8')).not.toMatch(/identity\.netlify|decap-cms|unpkg\.com/);
  }
});

test('外部スクリプトとインラインコードをブラウザが実際に遮断する', async ({ page }) => {
  await page.addInitScript(() => {
    window.blockedScripts = [];
    document.addEventListener('securitypolicyviolation', event => {
      if (event.effectiveDirective.startsWith('script-src')) window.blockedScripts.push(event.blockedURI);
    });
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const inline = document.createElement('script');
    inline.textContent = 'window.untrustedCodeExecuted=true';
    document.body.appendChild(inline);
    const external = document.createElement('script');
    external.src = 'https://attacker.invalid/untrusted.js';
    document.body.appendChild(external);
  });
  await expect.poll(() => page.evaluate(() => window.blockedScripts)).toContain('inline');
  await expect.poll(() => page.evaluate(() => window.blockedScripts.some(uri => uri.startsWith('https://attacker.invalid')))).toBe(true);
  expect(await page.evaluate(() => window.untrustedCodeExecuted)).toBeUndefined();
});
