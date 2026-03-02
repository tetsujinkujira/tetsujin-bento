# 手作り弁当喰楽部 鉄人 Webサイトリニューアル - 作業継続ファイル

最終更新: 2026年2月25日

---

## 現在のステータス

**Phase 1: 要件定義・素材収集** → 完了
**Phase 2: 実装・公開** → 完了
**Phase 3: 運用準備** → 完了

---

## 完了した作業

### 1. 既存サイト分析（完了）
- 現行サイト（tetsujin-kujira.com）の情報を抽出
- 食べログ、ヒトサラ等から店舗情報・メニュー・口コミを収集
- **成果物**: `docs/01_既存サイト分析レポート.md`

### 2. 要件定義（完了）
- ヒアリング実施（注文方式、ターゲット、技術方針、デザイン等）
- **成果物**: `docs/02_要件定義書.md`（v1.6）

### 3. 実装（完了）
- [x] Vite + Tailwind CSS でプロジェクト構築
- [x] 全ページ実装（TOP、メニュー、配達エリア、鉄人とは、ご注文方法、採用情報、特商法、プライバシーポリシー、404）
- [x] レスポンシブ対応
- [x] アニメーション・インタラクション実装
- [x] PWA対応

### 4. GitHub設定（完了）
- [x] GitHubリポジトリ作成（tetsujinkujira/tetsujin-bento）
- [x] GitHub Pages有効化
- [x] GitHub Actions自動デプロイ設定（テスト付き）

### 5. SEO対策（完了）
- [x] OGPタグ（全ページ、og:locale含む）
- [x] Twitter Card（全ページ）
- [x] 構造化データ（Restaurant, Organization, WebSite, BreadcrumbList, Menu, JobPosting, FoodService, FAQPage）
- [x] robots.txt / sitemap.xml（image sitemap対応）
- [x] meta description最適化
- [x] dns-prefetch / preconnect（全ページ）
- [x] ヒーロー画像のpreload（LCP対策）
- [x] 全画像にwidth/height属性（CLS防止）
- [x] picture要素でWebP/JPGフォールバック
- [x] 配達エリアページにローカルキーワード追加
- [x] 内部リンク強化

### 6. テスト・CI/CD（完了）
- [x] Playwright E2Eテスト 66件
- [x] pre-commit フック（ビルド→テスト 2段階）
- [x] pre-push フック（テスト実行）
- [x] GitHub Actionsにテストステップ追加（デプロイ前検証）
- [x] 自動プッシュスクリプト（scripts/auto-push.sh）

### 7. キャッシュ対策（完了）
- [x] fetch()にcache:'no-cache'設定
- [x] Service Workerのビルド毎バージョン自動更新

### 8. 運用準備（完了）
- [x] コンテンツ編集を1ファイルに統合（site-config.json）
- [x] 編集マニュアル作成（`docs/編集マニュアル.md`）
- [x] スマホ更新手順書作成（`docs/スマホ更新手順.md`）
- [x] README作成（著作権・改変禁止表記）

---

## 公開URL

**本番サイト**: https://tetsujinkujira.github.io/tetsujin-bento/

---

## ドメイン取得後にやること

### 1. DNS設定（ドメイン管理サービス側）

ドメイン管理サービス（お名前.com、ムームードメイン等）で以下のDNSレコードを設定する。

**Aレコード（4つすべて追加）:**

| ホスト名 | タイプ | 値 |
|---------|--------|-----|
| @ | A | 185.199.108.153 |
| @ | A | 185.199.109.153 |
| @ | A | 185.199.110.153 |
| @ | A | 185.199.111.153 |

**CNAMEレコード（wwwサブドメイン用）:**

| ホスト名 | タイプ | 値 |
|---------|--------|-----|
| www | CNAME | tetsujinkujira.github.io |

### 2. GitHub Pages側の設定

1. リポジトリの **Settings** → **Pages** を開く
2. **Custom domain** に取得したドメインを入力（例: `tetsujin-kujira.com`）
3. **Save** を押す
4. DNS反映後（数分〜数時間）、**Enforce HTTPS** にチェックを入れる

### 3. サイト内URLの一括変更

以下のファイル内で `tetsujinkujira.github.io/tetsujin-bento` を新ドメインに変更する。

**対象箇所:**
- [ ] 全HTMLファイルの `<link rel="canonical">` （9ファイル）
- [ ] 全HTMLファイルの `<meta property="og:url">` （8ファイル）
- [ ] 全HTMLファイルの `<meta property="og:image">` （8ファイル）
- [ ] 全HTMLファイルの `<meta name="twitter:image">` （8ファイル）
- [ ] 構造化データ（JSON-LD）内のURL（index.html, menu.html, about.html, area.html, order.html, recruit.html）
- [ ] `public/sitemap.xml` 内の全URL
- [ ] `public/manifest.json` の `start_url` / `scope`
- [ ] `vite.config.js` の `base` パス（`/tetsujin-bento/` → `/`）

**作業コマンド例（Claude Codeに依頼）:**
```
「ドメインを tetsujin-kujira.com に変更して。全ファイルのURLを一括更新して。」
```

### 4. Google Search Console登録

1. https://search.google.com/search-console にアクセス
2. 「プロパティを追加」→「ドメイン」→ ドメインを入力
3. DNS TXTレコードで所有権確認
4. 確認後、「サイトマップ」→ `https://新ドメイン/sitemap.xml` を送信

### 5. 確認事項

- [ ] `https://新ドメイン/` でサイトが表示される
- [ ] `https://www.新ドメイン/` がリダイレクトされる
- [ ] HTTPS（鍵マーク）が表示される
- [ ] 旧URL（github.io）からのリダイレクトが動作する
- [ ] OGPデバッガーで確認（https://developers.facebook.com/tools/debug/）
- [ ] テスト全通過（`npm test`）

---

## コンテンツ編集方法

### 編集対象ファイル（1つだけ）

```
public/data/site-config.json
```

### 編集ページURL

https://github.com/tetsujinkujira/tetsujin-bento/blob/main/public/data/site-config.json

### マニュアル

- 編集マニュアル: `docs/編集マニュアル.md`
- スマホ更新手順: `docs/スマホ更新手順.md`

---

## プロジェクト構成

```
/Users/hori/Desktop/案件プロジェクト/手作り弁当喰楽部鉄人/
├── continue.md          ← 本ファイル（作業継続用）
├── README.md            ← 著作権・利用規約
├── docs/
│   ├── 01_既存サイト分析レポート.md
│   ├── 02_要件定義書.md
│   ├── 03_素材情報収集チェックリスト.md
│   ├── 編集マニュアル.md
│   └── スマホ更新手順.md
├── public/
│   ├── data/
│   │   ├── site-config.json  ← お知らせ・日替わり（編集対象）
│   │   ├── menu.json
│   │   └── area.json
│   ├── images/
│   │   ├── menu/     ← メニュー画像（M-02〜M-25.jpg/.webp, kanban.jpg/.webp）
│   │   ├── top/      ← トップ画像（top.jpg/.webp）
│   │   └── store/    ← 店舗画像（haitatsu.jpg/.webp）
│   ├── sitemap.xml
│   ├── robots.txt
│   ├── sw.js
│   └── manifest.json
├── src/
│   ├── index.html, menu.html, area.html, about.html
│   ├── order.html, recruit.html, legal.html, privacy.html, 404.html
│   ├── css/style.css
│   └── js/main.js
├── tests/
│   └── degration.spec.js  ← E2Eテスト（66件）
├── scripts/
│   └── auto-push.sh       ← 自動テスト&プッシュ
├── .husky/
│   ├── pre-commit         ← ビルド→テスト 2段階チェック
│   └── pre-push           ← テスト実行
├── .github/workflows/
│   └── deploy.yml         ← GitHub Actions（テスト→ビルド→デプロイ）
├── vite.config.js
├── tailwind.config.js
├── playwright.config.js
└── package.json
```

---

## 再開時のコマンド例

```
# このプロジェクトの続きをやりたい場合
「continue.mdを読んで、作業を再開して」

# ドメイン設定をしたい場合
「カスタムドメインの設定をしたい。ドメインは○○.com」

# コンテンツを編集したい場合
「お知らせを更新したい」
「日替わりメニューを3月分に更新したい」
```

---

## メモ・備考

- GitHubアカウント: tetsujinkujira
- 管理画面（Decap CMS）は断念 → GitHub直接編集方式に変更
- 編集はスマホからGitHubアプリで可能（手順書あり）
- 店舗住所: 東京都港区新橋6-16-4 松永ビル1階
- 電話番号: 03-3432-3720
- テスト: 66件（Playwright）
- 画像: 各メニューに JPG + WebP の2形式を用意
