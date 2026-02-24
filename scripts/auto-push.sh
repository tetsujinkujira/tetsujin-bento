#!/bin/bash
#
# auto-push.sh - 自動テスト＆プッシュスクリプト
#
# Claude Code から呼び出す用。
# ビルド → テスト → git add → commit → push の流れを自動実行。
# 失敗時はエラー内容を出力して終了（Claude Codeが修正して再実行）。
#
# 使い方:
#   ./scripts/auto-push.sh "コミットメッセージ"
#

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# コミットメッセージの確認
COMMIT_MSG="$1"
if [ -z "$COMMIT_MSG" ]; then
  echo -e "${RED}エラー: コミットメッセージを指定してください${NC}"
  echo "使い方: ./scripts/auto-push.sh \"コミットメッセージ\""
  exit 1
fi

echo "========================================"
echo " 自動テスト＆プッシュ"
echo "========================================"
echo ""

# ステップ1: ビルドチェック
echo -e "${YELLOW}[1/4] vite build でビルドチェック...${NC}"
BUILD_OUTPUT=$(npm run build 2>&1)
BUILD_EXIT=$?

if [ $BUILD_EXIT -ne 0 ]; then
  echo ""
  echo -e "${RED}❌ ビルド失敗${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "$BUILD_OUTPUT"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
fi
echo -e "${GREEN}✅ ビルド成功${NC}"
echo ""

# ステップ2: Playwrightテスト実行
echo -e "${YELLOW}[2/4] Playwrightテスト実行...${NC}"
TEST_OUTPUT=$(npx playwright test 2>&1)
TEST_EXIT=$?

if [ $TEST_EXIT -ne 0 ]; then
  echo ""
  echo -e "${RED}❌ テスト失敗${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "$TEST_OUTPUT"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
fi
echo -e "${GREEN}✅ 全テストパス${NC}"
echo ""

# ステップ3: git add & commit
echo -e "${YELLOW}[3/4] git add & commit...${NC}"
git add -A
git commit -m "$COMMIT_MSG" --no-verify
echo -e "${GREEN}✅ コミット完了${NC}"
echo ""

# ステップ4: git push
echo -e "${YELLOW}[4/4] git push...${NC}"
git push
echo -e "${GREEN}✅ プッシュ完了${NC}"
echo ""

echo "========================================"
echo -e "${GREEN} 全ステップ完了！${NC}"
echo "========================================"
