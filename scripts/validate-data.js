import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// フォーム保存後も、構文だけでなく表示に必要な構造を検証する。
export function validateSiteData(data) {
  const errors = [];
  const check = (ok, path, message) => { if (!ok) errors.push(`${path}: ${message}`); };
  const text = (value, path) => check(typeof value === 'string' && value.trim().length > 0, path, '文字を入力してください');
  const price = (value, path) => check(Number.isSafeInteger(value) && value > 0, path, '1円以上の整数で入力してください');
  const array = (value, path) => {
    check(Array.isArray(value) && value.length > 0, path, '空でない一覧が必要です');
    return Array.isArray(value) ? value : [];
  };
  const unique = (items, path) => {
    const ids = new Set();
    items.forEach((item, i) => {
      text(item?.id, `${path}[${i}].id`);
      check(!ids.has(item?.id), `${path}[${i}].id`, 'IDが重複しています');
      ids.add(item?.id);
    });
  };
  const news = data?.news ?? {};
  text(news.title, 'news.title');
  const date = typeof news.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(news.date) ? new Date(`${news.date}T00:00:00Z`) : new Date(NaN);
  check(!Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === news.date, 'news.date', '実在する日付をYYYY-MM-DD形式で入力してください');
  check(['news', 'new_menu', 'holiday', 'campaign'].includes(news.category), 'news.category', '種類を選択してください');
  check(news.body == null || typeof news.body === 'string', 'news.body', '本文は文字列で入力してください');

  const daily = data?.daily ?? {};
  check(typeof daily.year === 'string' && /^\d{4}$/.test(daily.year), 'daily.year', '西暦4桁で入力してください');
  check(/^(?:[1-9]|1[0-2])月$/.test(daily.month), 'daily.month', '1月〜12月を選択してください');
  text(daily.menuName, 'daily.menuName');
  text(daily.menuReading, 'daily.menuReading');
  price(daily.price, 'daily.price');
  const schedule = array(daily.schedule, 'daily.schedule');
  check(JSON.stringify(schedule.map(day => day?.day)) === JSON.stringify(['月', '火', '水', '木', '金', '土']), 'daily.schedule', '月〜土を各1件、順番どおりに設定してください');
  schedule.forEach((day, i) => {
    const path = `daily.schedule[${i}]`;
    check(Array.isArray(day?.items), `${path}.items`, 'おかずは一覧で入力してください');
    if (Array.isArray(day?.items)) day.items.forEach((item, j) => text(item, `${path}.items[${j}]`));
    check(day?.items?.length > 0 || (typeof day?.note === 'string' && day.note.trim().length > 0), path, 'おかずまたは備考を入力してください');
  });
  check(daily.menuItem?.isDaily === true, 'daily.menuItem', '日替わりの内部設定が必要です');
  text(daily.menuItem?.id, 'daily.menuItem.id');

  const menu = data?.menu ?? {};
  const categories = array(menu.categories, 'menu.categories');
  unique(categories, 'menu.categories');
  const categoryIds = new Set(categories.map(category => category?.id));
  check(['kanban', 'standard', 'chef', 'makunouchi', 'premium'].every(id => categoryIds.has(id)), 'menu.categories', '既存カテゴリが不足しています');
  check(categoryIds.has(daily.menuItem?.categoryId), 'daily.menuItem.categoryId', '存在するカテゴリが必要です');
  const items = array(menu.items, 'menu.items');
  unique([...items, daily.menuItem], 'menu.items');
  items.forEach((item, i) => {
    const path = `menu.items[${i}]`;
    text(item?.name, `${path}.name`);
    text(item?.description, `${path}.description`);
    price(item?.price, `${path}.price`);
    check(categoryIds.has(item?.categoryId), `${path}.categoryId`, '存在するカテゴリを選択してください');
    check(!item?.isDaily, path, '日替わりはdailyのみで管理します');
    if (item?.categoryId !== 'premium') {
      check(typeof item?.image === 'string' && /^[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp|gif)$/.test(item.image) && existsSync(new URL(`../public/images/menu/${item.image}`, import.meta.url)), `${path}.image`, '画像ファイルが見つかりません');
    }
    if (item?.toppings != null) {
      const toppings = array(item.toppings, `${path}.toppings`);
      unique(toppings, `${path}.toppings`);
      toppings.forEach((topping, j) => {
        text(topping?.name, `${path}.toppings[${j}].name`);
        price(topping?.price, `${path}.toppings[${j}].price`);
      });
    }
  });
  for (const id of categoryIds) check(items.some(item => item?.categoryId === id), `menu.${id}`, '商品が必要です');
  array(menu.sideMenus?.categories, 'menu.sideMenus.categories').forEach((category, i) => {
    text(category?.name, `menu.sideMenus.categories[${i}].name`);
    array(category?.items, `menu.sideMenus.categories[${i}].items`).forEach((item, j) => {
      text(item?.name, `menu.sideMenus.categories[${i}].items[${j}].name`);
      price(item?.price, `menu.sideMenus.categories[${i}].items[${j}].price`);
    });
  });
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const directory = new URL('../public/data/', import.meta.url);
    const files = readdirSync(directory).filter(name => name.endsWith('.json'));
    if (files.length !== 1 || files[0] !== 'site-config.json') throw new Error('更新データはpublic/data/site-config.jsonの1ファイルに統一してください');
    const data = JSON.parse(readFileSync(new URL('site-config.json', directory), 'utf8'));
    const errors = validateSiteData(data);
    if (errors.length) throw new Error(errors.join('\n'));
    console.log('JSON OK: public/data/site-config.json（構文・必須項目・価格・日付・画像）');
  } catch (error) {
    console.error(`JSON ERROR: ${error.message}`);
    process.exitCode = 1;
  }
}
