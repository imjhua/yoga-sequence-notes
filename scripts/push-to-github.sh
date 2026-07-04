#!/usr/bin/env bash
# imjhua 계정으로 GitHub repo 생성 & push (최초 1회 gh auth login 필요)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

source "${ROOT}/scripts/imjhua-env.sh"

echo "→ imjhua gh auth 상태 확인 (config: ${GH_CONFIG_DIR})"
if ! gh auth status -h github.com &>/dev/null; then
  echo ""
  echo "아직 imjhua github.com 로그인이 없습니다."
  echo "아래 명령을 실행한 뒤, 다시 이 스크립트를 실행하세요:"
  echo ""
  echo "  ./scripts/imjhua-gh.sh auth login -h github.com -p ssh -s repo,read:org"
  echo ""
  exit 1
fi

if git remote get-url origin &>/dev/null; then
  echo "→ origin 이미 설정됨: $(git remote get-url origin)"
else
  echo "→ remote origin 추가"
  git remote add origin "git@github.com:imjhua/yoga-sequence-notes.git"
fi

if gh repo view imjhua/yoga-sequence-notes &>/dev/null; then
  echo "→ repo 존재함, push만 진행"
  git push -u origin main
else
  echo "→ repo 생성 & push"
  gh repo create imjhua/yoga-sequence-notes --public --source=. --remote=origin --push
fi

echo ""
echo "✓ 완료: https://github.com/imjhua/yoga-sequence-notes"
