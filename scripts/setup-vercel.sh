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
  echo "1. https://vercel.com/account/tokens 에서 토큰 생성 (imjhua Vercel 계정)"
  echo "2. export VERCEL_TOKEN=your_vercel_token"
  echo "3. ./scripts/setup-vercel.sh"
  exit 1
fi

if [[ "${VERCEL_TOKEN}" == ghp_* || "${VERCEL_TOKEN}" == github_* ]]; then
  echo "❌ GitHub 토큰(ghp_...)을 넣으셨습니다. Vercel 토큰이 필요합니다."
  echo ""
  echo "  GitHub 토큰 → github.com (git push용)"
  echo "  Vercel 토큰  → vercel.com/account/tokens (배포용)"
  echo ""
  echo "대시보드로 연결하려면: https://vercel.com/new"
  exit 1
fi

echo "→ Vercel 토큰 확인"
WHOAMI=$(curl -sS -w "\nHTTP:%{http_code}" "https://api.vercel.com/v2/user" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}")
WHO_HTTP=$(echo "$WHOAMI" | tail -1 | cut -d: -f2)
WHO_BODY=$(echo "$WHOAMI" | sed '$d')

if [[ "$WHO_HTTP" != "200" ]]; then
  echo "❌ Vercel 토큰이 유효하지 않습니다 (HTTP ${WHO_HTTP})"
  echo "$WHO_BODY" | python3 -m json.tool 2>/dev/null || echo "$WHO_BODY"
  echo ""
  echo "https://vercel.com/account/tokens 에서 새 토큰을 만드세요 (imjhua 계정)."
  exit 1
fi

VERCEL_USER=$(echo "$WHO_BODY" | python3 -c "import sys,json; u=json.load(sys.stdin).get('user',{}); print(u.get('username') or u.get('email') or '?')" 2>/dev/null)
echo "   로그인: ${VERCEL_USER}"

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
  if echo "$BODY" | grep -q 'invalidToken'; then
    echo "❌ Vercel 토큰이 잘못되었습니다. GitHub 토큰(ghp_)이 아닌 Vercel 토큰을 사용하세요."
  elif echo "$BODY" | grep -q 'GitHub integration'; then
    echo "❌ GitHub 연동 필요: https://github.com/apps/vercel 을 imjhua 계정에 설치하세요."
  else
    echo "❌ 실패 (HTTP ${HTTP})"
  fi
  echo ""
  echo "대시보드로 연결 (가장 쉬움): https://vercel.com/new → imjhua/yoga-sequence-notes"
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
