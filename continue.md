# 手作り弁当喰楽部 鉄人 Webサイトリニューアル - 作業継続ファイル

最終更新: 2026年3月2日

---

## 現在のステータス

**Phase 1: 要件定義・素材収集** → 完了
**Phase 2: 実装・公開** → 完了
**Phase 3: 運用準備** → 完了
**Phase 4: カスタムドメイン設定** → 完了（2026年3月2日）

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
- [x] Playwright E2Eテスト 70件
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

### 9. カスタムドメイン設定（完了 - 2026年3月2日）
- [x] ドメイン取得: tetsujin-kujira.com
- [x] DNS設定（ムームードメイン）
  - Aレコード4つ（185.199.108-111.153）※サブドメイン欄は空欄
  - CNAMEレコード（www → tetsujinkujira.github.io）
  - ネームサーバ: ムームーDNSを使用
- [x] GitHub Pages カスタムドメイン設定
- [x] TLS証明書発行・Enforce HTTPS有効化
- [x] サイト内URL一括変更（15ファイル）
  - 全HTMLのcanonical / OGP / Twitter Card / 構造化データURL
  - sitemap.xml, robots.txt, manifest.json
  - vite.config.js の base パス（`/tetsujin-bento/` → `/`）
  - Service Worker / テストの BASE_PATH
- [x] テスト全70件通過確認

### 10. メニュー修正（2026年3月2日）
- [x] 紫蘇（シソ）の説明文修正: 「イカ」→「鯵」に変更

### 11. レスポンシブ改善（2026年3月2日）
- [x] メニューページのスマホ表示を2列グリッドに変更（定番・シェフおすすめ・幕の内の3セクション）

### 12. メニューページ動的レンダリング化（2026年3月2日）
- [x] menu.json にimage寸法（imageWidth/imageHeight）を追加（CLS防止）
- [x] menu.html のハードコードされたメニューカードを動的コンテナに置換
  - 看板メニュー / スタンダード / シェフおすすめ / 幕の内 / 会席膳 / サイドメニュー
  - 各コンテナにローディングスケルトン配置
- [x] main.js にメニューレンダリングエンジンを追加
  - renderMenuCard / renderKanbanSection / renderPremiumSection / renderSideMenus 等
  - ライトボックスをイベント委譲方式に変更（動的コンテンツ対応）
- [x] E2Eテスト修正・追加（74件に増加）
  - 画像テストに waitForSelector 追加
  - 動的レンダリングテスト4件追加（カード数検証、看板、サイド、会席膳）
- [x] 編集マニュアルに menu.json の編集手順を追記

---

## 公開URL

**本番サイト**: https://www.tetsujin-kujira.com/
**旧URL**: https://tetsujinkujira.github.io/tetsujin-bento/ （自動リダイレクト）

---

## ドメイン設定（完了）

### 設定内容（ムームードメイン）

**ネームサーバ:** ムームーDNSを使用（※「ムームーDNS」でないとカスタムDNS設定が反映されない）

**Aレコード（4つ）:** ※サブドメイン欄は `@` ではなく **空欄** にする

| サブドメイン | タイプ | 値 |
|------------|--------|-----|
| （空欄） | A | 185.199.108.153 |
| （空欄） | A | 185.199.109.153 |
| （空欄） | A | 185.199.110.153 |
| （空欄） | A | 185.199.111.153 |

**CNAMEレコード:**

| サブドメイン | タイプ | 値 |
|------------|--------|-----|
| www | CNAME | tetsujinkujira.github.io |

### GitHub Pages設定

- Custom domain: `www.tetsujin-kujira.com`
- Enforce HTTPS: 有効

### 今後やること

- [x] Google Search Console登録（2026年3月2日完了）
  - ドメインプロパティ: tetsujin-kujira.com
  - DNS TXTレコードで所有権確認済み
  - サイトマップ送信済み: https://www.tetsujin-kujira.com/sitemap.xml
  - 全ページのインデックス登録リクエスト済み
- [x] Googleビジネスプロフィール登録（2026年3月2日完了）
  - ビジネスの説明文追加済み
- OGPデバッガー確認 → スキップ（必要時に実施）

---

## コンテンツ編集方法

### 編集対象ファイル

| ファイル | 内容 | 更新頻度 |
|---------|------|---------|
| `public/data/site-config.json` | お知らせ・日替わりメニュー | 毎月 |
| `public/data/menu.json` | メニュー品目・価格・説明・サイドメニュー | まれに |

### 編集ページURL

- site-config.json: https://github.com/tetsujinkujira/tetsujin-bento/blob/main/public/data/site-config.json
- menu.json: https://github.com/tetsujinkujira/tetsujin-bento/blob/main/public/data/menu.json

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
│   └── degration.spec.js  ← E2Eテスト（74件）
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
- ドメイン: tetsujin-kujira.com（ムームードメイン管理）
- テスト: 74件（Playwright）
- 画像: 各メニューに JPG + WebP の2形式を用意
