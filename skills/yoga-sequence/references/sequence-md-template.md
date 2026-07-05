# Sequence MD Template

파일: `sequences/seq{N}-{peak-slug}.md`

```markdown
---
title: "힐링-우르드바 다누라사나"
peak_pose: "우르드바 다누라사나"
theme: 힐링
focus: "몸 앞면 깨우기"
duration: 75
source_prompt: sequences/prompts/seq{N}-{slug}.prompt.txt
updated: 2026-07-04
---

# 힐링-우르드바 다누라사나

**포커스:** 몸 앞면 깨우기 · **피크포즈:** 우르드바 다누라사나

## 개요

- **핵심 cue**: cue1 / cue2 / cue3

## 수업 메모

- 수업 전·후 메모, cue, 주의사항

## 1. 시팅

| 포즈 | # | | |
|------|---|------|------|
| **수카사나** | 1 | 어깨 & 목 & 손목 돌리기 | |
| | 2 | 주먹 쥐고 팔 두드리기 | |
| | | | 위에서부터 아래로 3번 |
| | 3 | 허리 돌리기 | |
| | | | 오른쪽 왼쪽 |

## 마인드맵

<Mindmap name="seq{N}" />

## 초기 프롬프트

<script setup>
import sourcePrompt from './prompts/seq{N}-{slug}.prompt.txt?raw'
</script>

<CopyPrompt :text="sourcePrompt" label="원본 프롬프트" />
```

## 섹션 순서 (고정)

1. `# {theme}-{peak_pose}` + **포커스 · 피크포즈** (영어 괄호 금지)
2. **개요** — **핵심 cue만** (테마·총 시간 X, duration은 frontmatter)
3. **수업 메모**
4. 시퀀스 본문 (번호 섹션 + 3열 표)
5. **마인드맵**
6. **초기 프롬프트** (맨 아래)

## 표 (4열)

| 포즈 | # | | |
|------|---|------|------|
| **{자세명}** | 1 | 1depth cue | |
| | 2 | 1depth cue | |
| | | | 2depth cue |

- **1열**: 자세 시작 행에만 **볼드**, 이후 비움
- **4열 `#`**: 1depth 동작 번호 — 포즈 블록마다 1부터
- 모바일: `table-layout: fixed` + `word-break: keep-all` — 긴 포즈명 줄바꿈
- **3열**: 1depth cue
- **4열**: 2depth cue (번호 없음)
- 섹션 구분: `---` 대신 h2 border-top 1개 (표 bottom border 유지)

## index.md

```markdown
| 수업 | 포커스 | 날짜 |
|------|--------|------|
| [힐링-사마코나사나](./seq1-…) | 고관절 열기 | 2026-07-04 |
```

**최신 날짜가 위** (내림차순)

## prompt.txt 형식

```
요가 종류는 … 목표자세는 …

{포즈명}
* 1depth
  * 2depth
* 1depth

{다음 포즈}
...
```

- 포즈 사이 **빈 줄 1개**
- sub-bullet은 **스페이스 2칸** 들여쓰기
- 불필요한 연속 개행 제거

1. title = `{theme}-{peak_pose}`
2. 개요 = 핵심 cue 한 줄
3. 피크포즈 라벨 (`피크:` X)
4. 산스크리트 영문 병기 X
5. 마인드맵: `<Mindmap name="seq{N}" />` — SVG는 CSS 변수로 **다크모드** 대응
