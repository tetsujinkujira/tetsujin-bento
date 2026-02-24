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
  { path: `${BASE_PATH}/privacy.html`, name: 'プライバシーポリシーページ', title: 'プライバシーポリシー' },
  { path: `${BASE_PATH}/404.html`, name: '404エラーページ', title: 'ページが見つかりません' },
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
    // 404ページとプライバシーポリシーページはnoindexなのでdescription不要
    const pagesWithDescription = PAGES.filter(p => !p.path.includes('404') && !p.path.includes('privacy'));
    for (const pageInfo of pagesWithDescription) {
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

    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    // 複数の構造化データが存在することを確認（Restaurant, WebSite等）
    const count = await jsonLdScripts.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Restaurantの構造化データが含まれることを確認
    const allContent = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      return Array.from(scripts).map(s => s.textContent).join('');
    });
    expect(allContent).toContain('@context');
    expect(allContent).toContain('Restaurant');
    expect(allContent).toContain('手作り弁当喰楽部 鉄人');
  });
});

// ========================================
// 10. コンソールエラー確認テスト（全ページ）
// ========================================
test.describe('コンソールエラー確認', () => {
  for (const pageInfo of PAGES) {
    test(`${pageInfo.name}でJavaScriptエラーが発生しない`, async ({ page }) => {
      const errors = [];

      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      await page.goto(pageInfo.path);
      await page.waitForTimeout(2000);

      expect(errors, `${pageInfo.name}でJavaScriptエラー: ${errors.join(', ')}`).toHaveLength(0);
    });
  }
});

// ========================================
// 11. 全ページ内部リンク検証テスト
// ========================================
test.describe('内部リンク検証', () => {
  // 主要ページのみ（404は除外）
  const MAIN_PAGES = PAGES.filter(p => !p.path.includes('404'));

  for (const pageInfo of MAIN_PAGES) {
    test(`${pageInfo.name}の内部リンクが全て有効`, async ({ page, request }) => {
      await page.goto(pageInfo.path);

      // 全ての内部リンクを取得（tel:, mailto:, javascript:, #, 外部URLを除外）
      const hrefs = await page.evaluate((basePath) => {
        const links = document.querySelectorAll('a[href]');
        return Array.from(links)
          .map(a => a.getAttribute('href'))
          .filter(href =>
            href &&
            !href.startsWith('tel:') &&
            !href.startsWith('mailto:') &&
            !href.startsWith('javascript:') &&
            !href.startsWith('http://') &&
            !href.startsWith('https://') &&
            href !== '#'
          )
          // アンカーリンク(#xxx)のフラグメント部分を除去してページパスだけにする
          .map(href => href.split('#')[0])
          .filter(href => href.length > 0);
      }, BASE_PATH);

      // 重複を除去
      const uniqueHrefs = [...new Set(hrefs)];

      for (const href of uniqueHrefs) {
        // 相対パスを絶対パスに変換
        const url = new URL(href, `http://localhost:4173${pageInfo.path}`);
        const response = await request.get(url.pathname);
        expect(response.status(), `${pageInfo.name}のリンク「${href}」が404`).toBe(200);
      }
    });
  }
});

// ========================================
// 12. 電話番号の一貫性テスト
// ========================================
test.describe('電話番号の一貫性', () => {
  const EXPECTED_TEL = 'tel:03-3432-3720';
  const MAIN_PAGES = PAGES.filter(p => !p.path.includes('404'));

  for (const pageInfo of MAIN_PAGES) {
    test(`${pageInfo.name}の電話番号が正しい`, async ({ page }) => {
      await page.goto(pageInfo.path);

      const phoneLinks = page.locator('a[href^="tel:"]');
      const count = await phoneLinks.count();

      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const href = await phoneLinks.nth(i).getAttribute('href');
          expect(href, `${pageInfo.name}で不正な電話番号: ${href}`).toBe(EXPECTED_TEL);
        }
      }
    });
  }
});

// ========================================
// 13. モバイル電話ボタンの存在確認テスト
// ========================================
test.describe('モバイル電話ボタン確認', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  // 404ページ以外の全ページ
  const MAIN_PAGES = PAGES.filter(p => !p.path.includes('404'));

  for (const pageInfo of MAIN_PAGES) {
    test(`${pageInfo.name}にモバイル電話ボタンがある`, async ({ page }) => {
      await page.goto(pageInfo.path);

      // 固定電話ボタン（fixed + tel:リンク）の存在確認
      const phoneButton = page.locator('a[href="tel:03-3432-3720"].fixed, a[href="tel:03-3432-3720"] .fixed');
      const directFixed = page.locator('a.fixed[href="tel:03-3432-3720"]');

      const count = await directFixed.count();
      expect(count, `${pageInfo.name}にモバイル固定電話ボタンがありません`).toBeGreaterThan(0);

      // ボタンが表示されることを確認
      await expect(directFixed.first()).toBeVisible();
    });
  }
});

// ========================================
// 14. 決済方法の整合性テスト
// ========================================
test.describe('決済方法の整合性', () => {
  const EXPECTED_PAYMENTS = ['現金', 'au PAY', '楽天ペイ', 'メルペイ', 'd払い', 'J-Coin Pay', '請求書払い'];

  test('TOPページに全決済方法が表示されている', async ({ page }) => {
    await page.goto(`${BASE_PATH}/`);

    const paymentSection = await page.textContent('body');
    for (const payment of EXPECTED_PAYMENTS) {
      expect(paymentSection, `TOPページに「${payment}」がありません`).toContain(payment);
    }
  });

  test('ご注文方法ページに全決済方法が表示されている', async ({ page }) => {
    await page.goto(`${BASE_PATH}/order.html`);

    const paymentSection = await page.textContent('body');
    for (const payment of EXPECTED_PAYMENTS) {
      expect(paymentSection, `ご注文方法ページに「${payment}」がありません`).toContain(payment);
    }
  });

  test('TOPページとご注文方法ページの決済方法が一致する', async ({ page }) => {
    // TOPページの決済方法を取得
    await page.goto(`${BASE_PATH}/`);
    const topText = await page.textContent('body');

    // ご注文方法ページの決済方法を取得
    await page.goto(`${BASE_PATH}/order.html`);
    const orderText = await page.textContent('body');

    // 両ページに同じ決済手段が含まれることを確認
    for (const payment of EXPECTED_PAYMENTS) {
      const inTop = topText.includes(payment);
      const inOrder = orderText.includes(payment);
      expect(inTop, `TOPページに「${payment}」がありません`).toBe(true);
      expect(inOrder, `ご注文方法ページに「${payment}」がありません`).toBe(true);
    }
  });
});

// ========================================
// 15. 構造化データのJSON有効性テスト
// ========================================
test.describe('構造化データJSON有効性', () => {
  const PAGES_WITH_JSONLD = PAGES.filter(p => !p.path.includes('404') && !p.path.includes('privacy'));

  for (const pageInfo of PAGES_WITH_JSONLD) {
    test(`${pageInfo.name}のJSON-LDが有効なJSON`, async ({ page }) => {
      await page.goto(pageInfo.path);

      const jsonLdContents = await page.evaluate(() => {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        return Array.from(scripts).map(s => s.textContent);
      });

      for (let i = 0; i < jsonLdContents.length; i++) {
        const content = jsonLdContents[i];
        let parsed;
        try {
          parsed = JSON.parse(content);
        } catch (e) {
          throw new Error(`${pageInfo.name}の${i + 1}番目のJSON-LDがパースエラー: ${e.message}`);
        }
        // @contextが含まれることを確認
        expect(parsed['@context'], `${pageInfo.name}のJSON-LDに@contextがありません`).toBeTruthy();
        // @typeが含まれることを確認
        expect(parsed['@type'], `${pageInfo.name}のJSON-LDに@typeがありません`).toBeTruthy();
      }
    });
  }
});
