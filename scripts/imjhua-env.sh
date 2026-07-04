#!/usr/bin/env bash
# imjhua GitHub 환경 변수. gh/git 명령 전에 source 하거나 imjhua-gh.sh 사용.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export GH_CONFIG_DIR="${ROOT}/.gh"
export GH_HOST=github.com
mkdir -p "${GH_CONFIG_DIR}"
