#!/usr/bin/env bash
# Vercel 프로젝트 생성 + GitHub repo 연결
# 사전 조건:
#   1. https://github.com/apps/vercel 을 imjhua 계정에 설치
#   2. VERCEL_TOKEN 환경변수 (https://vercel.com/account/tokens)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "VERCEL_TOKEN이 필요합니다."
  echo ""
  echo "1. https://vercel.com/account/tokens 에서 토큰 생성 (imjhua 계정)"
  echo "2. export VERCEL_TOKEN=your_token"
  echo "3. ./scripts/setup-vercel.sh"
  exit 1
fi

PROJECT_NAME="yoga-sequence-notes"
REPO="imjhua/yoga-sequence-notes"

echo "→ Vercel 프로젝트 생성 / 연결: ${REPO}"

RESP=$(curl -sS -w "\nHTTP:%{http_code}" -X POST "https://api.vercel.com/v10/projects" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$(cat <<EOF
{
  "name": "${PROJECT_NAME}",
  "framework": null,
  "buildCommand": "npm run build",
  "outputDirectory": ".vitepress/dist",
  "installCommand": "npm install",
  "gitRepository": {
    "type": "github",
    "repo": "${REPO}"
  }
}
EOF
)")

HTTP=$(echo "$RESP" | tail -1 | cut -d: -f2)
BODY=$(echo "$RESP" | sed '$d')

echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"

if [[ "$HTTP" != "200" && "$HTTP" != "201" ]]; then
  echo ""
  echo "실패 (HTTP ${HTTP}). GitHub Vercel App 설치 여부를 확인하세요:"
  echo "  https://github.com/apps/vercel"
  exit 1
fi

PROJECT_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || true)

echo ""
echo "→ production 배포 트리거 (main)"
curl -sS -X POST "https://api.vercel.com/v13/deployments" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$(cat <<EOF
{
  "name": "${PROJECT_NAME}",
  "project": "${PROJECT_NAME}",
  "target": "production",
  "gitSource": {
    "type": "github",
    "repoId": "$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('link',{}).get('repoId','') or '')" 2>/dev/null)",
    "ref": "main"
  }
}
EOF
)" | python3 -m json.tool 2>/dev/null || true

echo ""
echo "✓ 완료. 배포 URL: https://${PROJECT_NAME}.vercel.app"
echo "  대시보드: https://vercel.com/dashboard"
