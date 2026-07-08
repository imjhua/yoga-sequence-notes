---
name: yoga-sequence-notes
description: Organize yoga class sequences as markdown notes with mind-map images and auto-start local VitePress preview. For vinyasa lyric classes, agent receives English lyrics in chat, translates to Korean, seeds JSON, and opens the edit UI. Commit and deploy to imjhua/yoga-sequence-notes only when the user requests. Use when the user mentions 요가 시퀀스, yoga sequence, mind map, peak pose, 빌드업, 수업 플랜, 빈야사, vinyasa, 가사, or pastes song lyrics.
---

# Yoga Sequence Notes

요가 수업 시퀀스를 **MD 노트 + 마인드맵 이미지**로 정리한다.  
입력·수정 시 **파일 생성과 로컬 미리보기는 자동**, **커밋·배포는 사용자 요청 시에만**.

> **이전 `yoga-sequence-mindmapper`(React/D3 JSON 앱)와 별개.**

## 스킬 위치 (source of truth)

| 위치 | 용도 |
|------|------|
| **repo** `skills/yoga-sequence-notes/` | Git 버전 관리 — **이 경로가 기준** |
| `~/.claude/skills/yoga-sequence-notes/` | Claude Code — repo와 동기화해서 사용 |
| `.cursor/skills/yoga-sequence-notes/` | Cursor (선택) — repo에서 복사 |

스킬 수정 시 **repo에 먼저 커밋** → 로컬 스킬 폴더에 동기화.

## Repo

| 항목 | 값 |
|------|-----|
| GitHub | https://github.com/imjhua/yoga-sequence-notes |
| 로컬 경로 | `~/Projects/yoga-sequence-notes` |
| MD | `sequences/*.md` |
| 프롬프트 | `sequences/prompts/*.prompt.txt` |
| 마인드맵 | `public/mindmaps/seq{N}-mindmap.svg` |
| 로컬 미리보기 | `npm run dev` → http://localhost:5173 |
| Production | https://yoga-sequence-notes.vercel.app |

---

## 행동 규칙 (필수)

### 🤖 자동 — 별도 지시 없이 즉시 실행

사용자가 **요가 시퀀스를 입력·붙여넣기·수정**하면 (트리거 키워드 없어도):

**`theme: 빈야사`** (가사 플로우 — [vinyasa-lyric-template.md](references/vinyasa-lyric-template.md))

1. 사용자가 **채팅에 영어 가사** 제공 (줄바꿈 = 구절) — **Studio 입력 UI 사용 안 함**
2. `sequences/prompts/seq{N}-{slug}.prompt.txt` 저장 (원문만)
3. 에이전트가 구절마다 **한국어 번역** (수업 cue 톤, 기계번역 API 사용 금지)
4. `node scripts/build-vinyasa-json.js … --prompt … --ko …` 로 JSON 생성
5. `node scripts/sync-vinyasa.js` · MD에 `<LyricFlowStudio name="…" />` (initial-lyrics **없음**)
6. validate:vinyasa · dev 서버 · 미리보기 URL

**inhale/exhale · 강조 · 메모(자세)** 는 사용자가 Studio에서만 설정.

**그 외 테마 (힐링 등)**
1. `sequences/seq{N}-*.md` 작성 또는 수정
   - **참고 링크 (선택)**: 제목 라인에 · `[수업명](/link)` 추가 (독립 섹션 X, 인라인만)
2. `python3 scripts/generate-mindmap.py seq{N}` (필요 시 preset 추가)
3. 신규 시퀀스면 `sequences/index.md` + `.vitepress/config.ts` 업데이트
4. `node scripts/validate-sequence.js` 실행
5. **로컬 dev 서버 기동** — 아래 [로컬 서버](#로컬-서버-자동-기동) 참고
6. 사용자에게 **미리보기 URL** 안내

**수정 후에도 동일** — MD/마인드맵/sidebar 갱신 → validate → dev 서버 확인 → URL 안내.

### 🔄 프롬프트 변경 시 (기존 시퀀스)

사용자가 **기존 시퀀스의 특정 섹션만 프롬프트 변경**하면:

1. **변경 지점만 식별** — "프롬프트 변경. {섹션명} / 추가 라인 / 삭제 라인"
2. **새 시퀀스 생성 X** — 기존 시퀀스 파일만 업데이트
3. `sequences/prompts/seq{N}-*.prompt.txt` 해당 섹션만 수정
4. `sequences/seq{N}-*.md` 표만 갱신 (다른 섹션 터치 금지)
5. 마인드맵 재생성 X (변경 필요 시만)
6. validate · dev 미리보기 · URL 안내

**예시:**
```
사용자: "프롬프트 변경. 수카사나 상단에 '두손 하늘 위로 뻗고' 등 3줄 추가해줘"
에이전트:
  1. seq{N} prompt.txt 수카사나 섹션만 수정
  2. seq{N} MD의 수카사나 표만 갱신 (다른 섹션 건드리지 않기!)
  3. validate · dev 확인 · URL 안내
```

### 🛑 수동 — 사용자가 배포를 요청할 때만

**커밋·push·배포는 사용자가 명시적으로 요청할 때만** 실행.

배포 요청 시: `npm run build` → git commit → push → Vercel 자동 재배포

---

## MD 포맷 (필수)

템플릿: [sequence-md-template.md](references/sequence-md-template.md)

| 영역 | 규칙 |
|------|------|
| 제목 | `{theme}-{peak_pose}` — 예: `힐링-사마코나사나` |
| 부제 | `**포커스:** … · **피크포즈:** …` (영어 산스크리트名 **금지**) — 선택적 참고 링크: · [`수업명`](/link) |
| **개요** | **`핵심 cue` 한 줄만** — 테마·총 시간 등 제거 |
| 표 | **3컬럼 고정**: 포즈 (15%) \| # (5%) \| 동작 (80%) — 호흡은 동작 내 `inhale`/`exhale` 배지 |
| index | `\| 수업 \| 포커스 \| 날짜 \|` — **최신순** |

본문 순서: **개요 → 수업 메모 → 시퀀스 본문 → 마인드맵 → 초기 프롬프트** (참고 링크는 제목 라인에만)

### 프롬프트 호흡 형식 자동 변환 규칙

입력 프롬프트 예시:
```
빌드업
* 욷카타사나
* 빈야사
* 마시는 숨: 한쪽다리 뒤로
* 내쉬는 숨: 무릎 접어 가슴 앞으로
* 마시는 숨: 전사1
* 내쉬는 숨: 전사2
```

변환 규칙:
- `* 포즈명` (호흡 없음): 새 섹션 시작 → `| **포즈명** | 1 | |`
  - 다음 호흡 정보부터 # 번호 증가
- `* 마시는 숨: 동작`: `| | # | `inhale` 동작 |` (# 증가)
- `* 내쉬는 숨: 동작`: `| | # | `exhale` 동작 |` (# 증가)
- **모든 표는 3컬럼 고정 유지**

**반대쪽 표기 규칙 (명시적):**
- **통일 대상:** `* (반대쪽)` (한 줄 전체가 "(반대쪽)"만 있는 경우) → MD: `| (반대쪽) |`
- **유지 대상 (건드리지 말 것):**
  - `* 반대쪽 …` (동작 설명 포함): 원문 유지 → `| 반대쪽 … |`
  - `* → 반대쪽`: 원문 유지 → `**→ 반대쪽**`
  - `* 반대쪽 다리`, `* 반대쪽 겨드랑이` 등 구체적 신체부위: 원문 유지

**예시 (통일 O):**
- 프롬프트: `* (반대쪽)` → MD: `| (반대쪽) |`

**예시 (원문 유지 X):**
- 프롬프트: `* 반대쪽 다리 넘어까지 길게 시선 …` → MD: `| 반대쪽 다리 넘어까지 길게 시선 … |`
- 프롬프트: `* 반대쪽 겨드랑이 안으로 …` → MD: `| 반대쪽 겨드랑이 안으로 … |`

변환된 MD 표:
```
| 포즈 | # | 동작 |
|------|---|------|
| **욷카타사나** | 1 | |
| **빈야사** | 2 | |
| **빌드업** | 3 | `inhale` 한쪽다리 뒤로 |
| | 4 | `exhale` 무릎 접어 가슴 앞으로 |
| | 5 | `inhale` 전사1 |
| | 6 | `exhale` 전사2 |
```

**빈야사 (`theme: 빈야사`)**: [vinyasa-lyric-template.md](references/vinyasa-lyric-template.md) — 가사 플로우 JSON + `<LyricFlow />`

---

## 로컬 서버 자동 기동

```bash
cd ~/Projects/yoga-sequence-notes
npm run dev    # 미기동 시 백그라운드 (block_until_ms: 0)
```

---

## 전체 파이프라인

```
[자동] 입력/수정 → prompt → MD → mindmap → index/sidebar → validate → npm run dev
[수동] "배포해줘" → build → commit → push → Vercel
```

상세: [publish-workflow.md](references/publish-workflow.md)

---

## 워크플로우

### Phase 1: 입력 → 파일 생성 (자동)

| 필드 | 설명 |
|------|------|
| `theme` | 요가 타입 (힐링, 파워, …) |
| `peak_pose` | 피크포즈 (한글만) |
| `focus` | 수업 포커스 — index 2열 |
| `title` | `{theme}-{peak_pose}` |
| `duration` | frontmatter만 (개요에 노출 X) |

### Phase 2–5

마인드맵 · sidebar · validate · dev — [publish-workflow.md](references/publish-workflow.md) 참고.

### Phase 6: 커밋 & 배포 (사용자 요청 시)

```bash
npm run build
git add sequences/ skills/ public/mindmaps/ .vitepress/config.ts
git commit -m "Update yoga sequence: {title}"
git push origin main
```

---

## 리소스

- [sequence-md-template.md](references/sequence-md-template.md)
- [publish-workflow.md](references/publish-workflow.md)
- [mindmap-image-guide.md](references/mindmap-image-guide.md)
- [deploy-workflow.md](references/deploy-workflow.md)
