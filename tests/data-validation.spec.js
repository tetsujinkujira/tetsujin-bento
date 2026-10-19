import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { validateSiteData } from '../scripts/validate-data.js';

// このファイルでは変更データをルーティングで注入するため、SWによる迂回を防ぐ。
test.use({ serviceWorkers: 'block' });

const data = JSON.parse(readFileSync(new URL('../public/data/site-config.json', import.meta.url), 'utf8'));
const cms = JSON.parse(readFileSync(new URL('../.pages.yml', import.meta.url), 'utf8'));

test('更新データが有効で、フォーム定義が全項目を保持できる', () => {
  expect(validateSiteData(data)).toEqual([]);
  const entries = cms.content;
  expect(entries).toHaveLength(1);
  expect(entries[0].path).toBe('public/data/site-config.json');
  function checkFields(value, fields, path) {
    const definitions = new Map(fields.map(field => [field.name, field]));
    for (const [key, child] of Object.entries(value)) {
      const field = definitions.get(key);
      expect(field, `${path}.${key}のフォーム定義が必要`).toBeTruthy();
      if (field.type === 'object' && child != null) {
        for (const entry of Array.isArray(child) ? child : [child]) checkFields(entry, field.fields, `${path}.${key}`);
      }
    }
  }
  checkFields(data, entries[0].fields, 'site');
});

for (const [name, modify, errorPath] of [
  ['負の価格', value => { value.menu.items[0].price = -1; }, 'menu.items[0].price'],
  ['小数の価格', value => { value.daily.price = 700.5; }, 'daily.price'],
  ['存在しない日付', value => { value.news.date = '2026-02-30'; }, 'news.date'],
  ['曜日抜け', value => { value.daily.schedule.pop(); }, 'daily.schedule'],
  ['空の商品名', value => { value.menu.items[0].name = ''; }, 'menu.items[0].name'],
  ['カテゴリ不明', value => { value.menu.items[0].categoryId = 'unknown'; }, 'menu.items[0].categoryId'],
  ['重複ID', value => { value.menu.items[1].id = value.menu.items[0].id; }, 'menu.items[1].id'],
  ['存在しない画像', value => { value.menu.items[0].image = 'missing-image.jpg'; }, 'menu.items[0].image'],
]) {
  test(`${name}を公開前に検出する`, () => {
    const changed = structuredClone(data);
    modify(changed);
    expect(validateSiteData(changed).some(error => error.startsWith(errorPath))).toBeTruthy();
  });
}

test('日替わり価格の変更がTOPとメニューに同時反映され、取得先も1つだけ', async ({ page }) => {
  const changed = structuredClone(data);
  changed.daily.price = 650;
  const requests = [];
  page.on('request', request => {
    if (/\/data\/.*\.json/.test(request.url())) requests.push(new URL(request.url()).pathname);
  });
  await page.route('**/data/site-config.json', route => route.fulfill({ json: changed }));
  await page.goto('/');
  await expect(page.locator('#category-price-standard')).toHaveText('¥650〜');
  expect(requests).toEqual(['/data/site-config.json']);
  requests.length = 0;
  await page.goto('/menu.html');
  await expect(page.locator('#daily-price')).toHaveText('¥650');
  await expect(page.locator('#standard-content .menu-card')).toHaveCount(11);
  expect(requests).toEqual(['/data/site-config.json']);
});
