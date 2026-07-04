#!/usr/bin/env bash
# imjhua 전용 gh CLI — 이 프로젝트에서만 사용. 전역 gh(kakaocorp) 설정은 건드리지 않음.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export GH_CONFIG_DIR="${ROOT}/.gh"
mkdir -p "${GH_CONFIG_DIR}"
exec gh "$@"
