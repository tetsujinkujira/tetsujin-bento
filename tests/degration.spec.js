// @ts-check
import { test, expect } from '@playwright/test';

/**
 * 手作り弁当喰楽部 鉄人 - デグレチェックテスト
 *
 * コミット・プッシュ・デプロイ前に実行して、
 * サイトの基本機能が正常に動作することを確認します。
 */

// ========================================
// テスト対象ページ一覧
// ========================================
// GitHub Pages用のbaseパス
const BASE_PATH = '/tetsujin-bento';

const PAGES = [
  { path: `${BASE_PATH}/`, name: 'TOPページ', title: '手作り弁当喰楽部 鉄人' },
  { path: `${BASE_PATH}/menu.html`, name: 'メニューページ', title: 'メニュー' },
  { path: `${BASE_PATH}/order.html`, name: 'ご注文方法ページ', title: 'ご注文方法' },
  { path: `${BASE_PATH}/area.html`, name: '配達エリアページ', title: '配達エリア' },
  { path: `${BASE_PATH}/about.html`, name: '鉄人とはページ', title: '鉄人とは' },
  { path: `${BASE_PATH}/recruit.html`, name: '採用情報ページ', title: '採用情報' },
  { path: `${BASE_PATH}/legal.html`, name: '特定商取引法ページ', title: '特定商取引法' },
];

// ========================================
// 1. ページ存在確認テスト
// ========================================
test.describe('ページ存在確認', () => {
  for (const page of PAGES) {
    test(`${page.name}が正常に表示される`, async ({ page: browserPage }) => {
      const response = await browserPage.goto(page.path);

      // ステータスコード200を確認
      expect(response?.status()).toBe(200);

      // タイトルに期待する文字列が含まれることを確認
      await expect(browserPage).toHaveTitle(new RegExp(page.title));
    });
  }
});

// ========================================
// 2. メタタグ確認テスト
// ========================================
test.describe('メタタグ確認', () => {
  test('TOPページにOGPタグが設定されている', async ({ page }) => {
    await page.goto(`${BASE_PATH}/`);

    // 必須メタタグの確認
    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
    const ogDescription = await page.getAttribute('meta[property="og:description"]', 'content');
    const ogImage = await page.getAttribute('meta[property="og:image"]', 'content');
    const ogUrl = await page.getAttribute('meta[property="og:url"]', 'content');

    expect(ogTitle).toBeTruthy();
    expect(ogDescription).toBeTruthy();
    expect(ogImage).toBeTruthy();
    expect(ogUrl).toBeTruthy();
  });

  test('TOPページにTwitterカードが設定されている', async ({ page }) => {
    await page.goto(`${BASE_PATH}/`);

    const twitterCard = await page.getAttribute('meta[name="twitter:card"]', 'content');
    const twitterTitle = await page.getAttribute('meta[name="twitter:title"]', 'content');

    expect(twitterCard).toBeTruthy();
    expect(twitterTitle).toBeTruthy();
  });

  test('各ページにdescriptionが設定されている', async ({ page }) => {
    for (const pageInfo of PAGES) {
      await page.goto(pageInfo.path);
      const description = await page.getAttribute('meta[name="description"]', 'content');
      expect(description, `${pageInfo.name}のdescriptionがありません`).toBeTruthy();
    }
  });
});

// ========================================
// 3. ナビゲーションリンク確認テスト
// ========================================
test.describe('ナビゲーション確認', () => {
  test('ヘッダーナビゲーションリンクが正常', async ({ page }) => {
    await page.goto(`${BASE_PATH}/`);

    // デスクトップナビのリンクを確認
    const navLinks = page.locator('header nav a[href]');
    const count = await navLinks.count();

    expect(count).toBeGreaterThan(0);

    // 各リンクが有効なhrefを持つことを確認
    for (let i = 0; i < count; i++) {
      const href = await navLinks.nth(i).getAttribute('href');
      expect(href).toBeTruthy();
    }
  });

  test('フッターリンクが正常', async ({ page }) => {
    await page.goto(`${BASE_PATH}/`);

    const footerLinks = page.locator('footer a[href]');
    const count = await footerLinks.count();

    expect(count).toBeGreaterThan(0);
  });

  test('メニューページへの遷移が正常', async ({ page }) => {
    await page.goto(`${BASE_PATH}/`);

    // 「メニューを見る」ボタンをクリック
    await page.click('a[href="./menu.html"]');

    // メニューページに遷移したことを確認
    await expect(page).toHaveURL(/menu\.html/);
  });
});

// ========================================
// 4. 画像読み込み確認テスト
// ========================================
test.describe('画像読み込み確認', () => {
  test('TOPページの主要画像が読み込まれる', async ({ page }) => {
    await page.goto(`${BASE_PATH}/`);

    // ヒーロー画像の確認
    const heroImage = page.locator('#hero-image');
    await expect(heroImage).toBeVisible();

    // 画像が正常に読み込まれたことを確認
    const naturalWidth = await heroImage.evaluate((img) => {
      return (img).naturalWidth;
    });
    expect(naturalWidth).toBeGreaterThan(0);
  });

  test('メニューページの画像が読み込まれる', async ({ page }) => {
    await page.goto(`${BASE_PATH}/menu.html`);

    // 画像要素が存在することを確認
    const images = page.locator('img');
    const count = await images.count();

    expect(count).toBeGreaterThan(0);
  });
});

// ========================================
// 5. 電話番号リンク確認テスト
// ========================================
test.describe('電話番号リンク確認', () => {
  test('電話番号リンクが正しい形式', async ({ page }) => {
    await page.goto(`${BASE_PATH}/`);

    const phoneLinks = page.locator('a[href^="tel:"]');
    const count = await phoneLinks.count();

    expect(count).toBeGreaterThan(0);

    // 電話番号形式を確認
    const href = await phoneLinks.first().getAttribute('href');
    expect(href).toBe('tel:03-3432-3720');
  });
});

// ========================================
// 6. モバイル表示確認テスト
// ========================================
test.describe('モバイル表示確認', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('モバイルでTOPページが正常に表示される', async ({ page }) => {
    await page.goto(`${BASE_PATH}/`);

    // モバイルメニューボタンが表示されることを確認
    const mobileMenuBtn = page.locator('#mobile-menu-btn');
    await expect(mobileMenuBtn).toBeVisible();
  });

  test('モバイルメニューが開閉できる', async ({ page }) => {
    await page.goto(`${BASE_PATH}/`);

    const mobileMenuBtn = page.locator('#mobile-menu-btn');
    const mobileMenu = page.locator('#mobile-menu');

    // 初期状態ではメニューは非表示
    await expect(mobileMenu).toBeHidden();

    // ボタンをクリックしてメニューを開く
    await mobileMenuBtn.click();
    await expect(mobileMenu).toBeVisible();

    // もう一度クリックして閉じる
    await mobileMenuBtn.click();
    await expect(mobileMenu).toBeHidden();
  });
});

// ========================================
// 7. デスクトップ表示確認テスト
// ========================================
test.describe('デスクトップ表示確認', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('デスクトップでナビゲーションが表示される', async ({ page }) => {
    await page.goto(`${BASE_PATH}/`);

    // デスクトップナビが表示されることを確認
    const desktopNav = page.locator('header nav.hidden.md\\:flex');
    await expect(desktopNav).toBeVisible();

    // モバイルメニューボタンは非表示
    const mobileMenuBtn = page.locator('#mobile-menu-btn');
    await expect(mobileMenuBtn).toBeHidden();
  });
});

// ========================================
// 8. お知らせティッカー確認テスト
// ========================================
test.describe('お知らせティッカー確認', () => {
  test('ティッカー要素が存在する', async ({ page }) => {
    await page.goto(`${BASE_PATH}/`);

    // ティッカー要素の存在を確認（データ読み込み失敗時は非表示になる場合がある）
    const ticker = page.locator('#news-ticker');
    await expect(ticker).toHaveCount(1);
  });
});

// ========================================
// 9. 構造化データ確認テスト
// ========================================
test.describe('構造化データ確認', () => {
  test('JSON-LD構造化データが存在する', async ({ page }) => {
    await page.goto(`${BASE_PATH}/`);

    const jsonLd = page.locator('script[type="application/ld+json"]');
    await expect(jsonLd).toHaveCount(1);

    // JSON-LDの内容を確認
    const content = await jsonLd.textContent();
    expect(content).toContain('@context');
    expect(content).toContain('Restaurant');
    expect(content).toContain('手作り弁当喰楽部 鉄人');
  });
});

// ========================================
// 10. コンソールエラー確認テスト
// ========================================
test.describe('コンソールエラー確認', () => {
  test('TOPページでJavaScriptエラーが発生しない', async ({ page }) => {
    const errors = [];

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto(`${BASE_PATH}/`);
    await page.waitForTimeout(2000); // アニメーション等の処理を待つ

    expect(errors, `JavaScriptエラー: ${errors.join(', ')}`).toHaveLength(0);
  });
});
