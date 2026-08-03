---
name: yoga-sequence-notes
description: Organize yoga class sequences as markdown notes and auto-start local VitePress preview. For vinyasa lyric classes, agent receives English lyrics in chat, translates to Korean, seeds JSON, and opens the edit UI. Commit and deploy to imjhua/yoga-sequence-notes only when the user requests. Use when the user mentions 요가 시퀀스, yoga sequence, peak pose, 빌드업, 수업 플랜, 빈야사, vinyasa, 가사, or pastes song lyrics.
---

# Yoga Sequence Notes

요가 수업 시퀀스를 **MD 노트**로 정리한다.  
입력·수정 시 **파일 생성과 로컬 미리보기는 자동**, **커밋·배포는 사용자 요청 시에만**.

> **이전 `yoga-sequence-mindmapper`(React/D3 JSON 앱)와 별개.**

## 스킬 위치 (source of truth)

| 위치 | 용도 |
|------|------|
| **repo** `skills/yoga-sequence-notes/` | Git 버전 관리 — **이 경로가 기준** |
| `~/.claude/skills/yoga-sequence-notes/` | Claude Code — repo와 동기화해서 사용 |
| `.cursor/skills/yoga-sequence-notes/` | Cursor (선택) — repo에서 복사 |

스킬 수정 시 **repo에 먼저 커밋** → 로컬 스킬 폴더에 동기화.

**스킬 수정 체크리스트**
1. **repo 먼저 수정**: `skills/yoga-sequence-notes/SKILL.md` (source of truth)
2. 로컬 스킬 폴더(`~/.claude/skills/yoga-sequence-notes/`)와 내용이 다르면 동기화 — **단, 커밋은 repo 버전에만**
3. 배포 전 `git status`로 `skills/yoga-sequence-notes/SKILL.md` 변경 여부 확인

## Repo

| 항목 | 값 |
|------|-----|
| GitHub | https://github.com/imjhua/yoga-sequence-notes |
| 로컬 경로 | `~/Projects/yoga-sequence-notes` |
| MD | `sequences/*.md` |
| 프롬프트 | `sequences/prompts/*.prompt.txt` |
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

**inhale/exhale · 강조**는 사용자가 Studio에서만 설정.

**그 외 테마 (힐링 등)**
1. `sequences/seq{N}-*.md` 작성 또는 수정
   - **참고 링크 (선택)**: 제목 라인에 · `[수업명](/link)` 추가 (독립 섹션 X, 인라인만)
   - **표 컬럼 순서 (필수)**: 표 컬럼은 반드시 `포즈 | # | 동작` (또는 필요에 따라 `포즈 | # | 동작 | 큐잉 | 효과 및 정렬 포인트`) 순서로 구성한다. 첫 번째 컬럼은 포즈(아사나명), 두 번째 컬럼은 단계 번호(`#`), 세 번째 컬럼은 동작/큐잉 내용이 배치되어야 한다.
   - **초기 프롬프트 항목 필수 포함**: 문서 마지막에 사용자가 입력한 원문 텍스트를 `## 초기 프롬프트` 섹션으로 반드시 포함한다.
2. 신규 시퀀스면 `sequences/index.md` + `.vitepress/config.ts` 업데이트
3. `node scripts/validate-sequence.js` 실행
4. **로컬 dev 서버 기동** — 아래 [로컬 서버](#로컬-서버-자동-기동) 참고
5. 사용자에게 **미리보기 URL** 안내

**수정 후에도 동일** — MD/sidebar 갱신 → validate → dev 서버 확인 → URL 안내.

**표 작성 규칙 (컬럼 순서)**
- 모든 시퀀스 표의 컬럼 순서는 `포즈` -> `#` -> `동작` (또는 `포즈` -> `#` -> `동작` -> `큐잉` -> `효과 및 정렬 포인트`) 순서를 엄격히 준수한다.
- 포즈명이 연속되는 경우, 첫 번째 단계에만 포즈명을 명시하거나 동일 블록 내에서 그룹화한다.

**표 예시**
```markdown
## 9. 받다코나사나

| 포즈 | # | 동작 |
| ------ | --- | ------ |
| **받다코나사나** | 1 | 두 발바닥 합족 |
| | 2 | 날개짓 |
| | 3 | 블럭을 사이에 껴서 조금씩 깊게 |
| | 4 | 등을 말아서 엄지발가락 터치 |
```

**초기 프롬프트 작성 규칙**
- MD 작성 시 문서 최하단에 `## 초기 프롬프트` 헤더를 생성하고, 사용자가 입력하거나 전달한 원문 텍스트를 코드 블록(```) 또는 텍스트 형태로 반드시 명시한다.

**아사나 세분화 규칙**
- 엎드린 흐름이 들어오면 `마카라사나` / `부장가사나` / `다누라사나`를 **하나의 표 안에서** 정리한다. 표를 여러 개로 쪼개지 말고, 포즈명이 바뀌는 지점에서 시작 행을 다시 써서 블록 경계를 보여준다.
- 한 섹션 안에서 아사나가 바뀌어도 표는 유지하고, `**아사나명**` 행을 반복해서 새 블록처럼 읽히게 만든다.
- 단순 휴식형 엎드림, 팔로 밀어 올리는 백벤드, 다리 잡고 올리는 백벤드는 서로 다른 아사나로 취급한다.
- 사용자가 한 블록 안에서 여러 아사나 이름을 함께 써도, 실제 cue가 바뀌면 MD에서는 아사나 단위를 나눠 읽기 쉽게 정리한다.

**오타 보정 규칙**
- 사용자가 준 프롬프트나 기존 초안에 보이는 명백한 오타는 MD로 옮길 때 자연스럽게 보정한다.
- 맞춤법이 흔들려도 cue 의미가 분명하면 의미를 유지하면서 표준 표기로 정리한다.
- 예: `옆구리가 길어지개` → `옆구리가 길어지게`
- 예: `오른족` → `오른쪽`
- 예: `합창`이 의도상 `합장`이면 문맥상 맞는 표현으로 보정한다.

### 🔄 프롬프트 변경 시 (기존 시퀀스)

사용자가 **기존 시퀀스의 특정 섹션만 프롬프트 변경**하면:

1. **변경 지점만 식별** — "프롬프트 변경. {섹션명} / 추가 라인 / 삭제 라인"
2. **새 시퀀스 생성 X** — 기존 시퀀스 파일만 업데이트
3. `sequences/prompts/seq{N}-*.prompt.txt` 해당 섹션만 수정
4. `sequences/seq{N}-*.md` 표만 갱신 (다른 섹션 터치 금지)
5. validate · dev 미리보기 · URL 안내