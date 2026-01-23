# 手作り弁当喰楽部 鉄人 Webサイトリニューアル - 作業継続ファイル

最終更新: 2026年1月24日

---

## 現在のステータス

**Phase 1: 要件定義・素材収集** → 完了
**Phase 2: 実装・公開** → 完了
**Phase 3: 運用準備** → 進行中

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
- [x] 全ページ実装（TOP、メニュー、配達エリア、鉄人とは、ご注文方法、採用情報、特商法）
- [x] レスポンシブ対応
- [x] アニメーション・インタラクション実装

### 4. GitHub設定（完了）
- [x] GitHubリポジトリ作成（tetsujinkujira/tetsujin-bento）
- [x] GitHub Pages有効化
- [x] GitHub Actions自動デプロイ設定

### 5. SEO対策（完了）
- [x] OGPタグ（SNSシェア用）
- [x] Twitter Card
- [x] 構造化データ（JSON-LD）
- [x] robots.txt / sitemap.xml
- [x] meta description最適化

### 6. 運用準備（完了）
- [x] コンテンツ編集を1ファイルに統合（site-config.json）
- [x] 編集マニュアル作成（`docs/編集マニュアル.md`）
- [x] README作成（著作権・改変禁止表記）

---

## 公開URL

**本番サイト**: https://tetsujinkujira.github.io/tetsujin-bento/

---

## 次にやること

### 優先度: 高

1. **カスタムドメイン設定**
   - [ ] ドメイン（tetsujin-kujira.com）の移管またはDNS設定
   - [ ] GitHub Pagesでカスタムドメイン設定
   - [ ] HTTPS有効化確認
   - [ ] サイト内のURL（OGP、canonical等）を本番ドメインに変更

### 優先度: 中

2. **Google関連設定**
   - [ ] Google Search Consoleに登録
   - [ ] サイトマップ送信
   - [ ] Google Analyticsの導入（必要であれば）

3. **コンテンツ調整**
   - [ ] 実際の運用でお知らせ・日替わりメニューを更新テスト
   - [ ] クライアントへの編集方法レクチャー

### 優先度: 低

4. **追加改善（任意）**
   - [ ] パフォーマンス最適化（画像圧縮等）
   - [ ] アクセシビリティ改善
   - [ ] 多言語対応（将来）

---

## コンテンツ編集方法

### 編集対象ファイル（1つだけ）

```
public/data/site-config.json
```

### 編集ページURL

https://github.com/tetsujinkujira/tetsujin-bento/blob/main/public/data/site-config.json

### 編集マニュアル

https://github.com/tetsujinkujira/tetsujin-bento/blob/main/docs/編集マニュアル.md

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
│   └── 編集マニュアル.md
├── public/
│   ├── data/
│   │   ├── site-config.json  ← お知らせ・日替わり（編集対象）
│   │   ├── menu.json
│   │   └── area.json
│   └── images/
├── src/
│   ├── index.html
│   ├── menu.html
│   ├── area.html
│   ├── about.html
│   ├── order.html
│   ├── recruit.html
│   ├── legal.html
│   ├── css/style.css
│   └── js/main.js
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## 再開時のコマンド例

```
# このプロジェクトの続きをやりたい場合
「continue.mdを読んで、作業を再開して」

# ドメイン設定をしたい場合
「カスタムドメインの設定をしたい」

# コンテンツを編集したい場合
「お知らせを更新したい」
```

---

## メモ・備考

- GitHubアカウント: tetsujinkujira
- 管理画面（Decap CMS）は断念 → GitHub直接編集方式に変更
- 編集はスマホからもGitHubブラウザで可能
- 店舗住所: 東京都港区新橋6-16-4 松永ビル1階
- 電話番号: 03-3432-3720
