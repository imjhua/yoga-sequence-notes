---
name: yoga-sequence-notes
description: Organize yoga class sequences as markdown notes with mind-map images and auto-start local VitePress preview. Commit and deploy to imjhua/yoga-sequence-notes only when the user requests. Use when the user mentions 요가 시퀀스, yoga sequence, mind map, peak pose, 빌드업, 수업 플랜, or pastes sequence content.
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

1. `prompt.txt` 저장 (원문)
2. `sequences/seq{N}-*.md` 작성 또는 수정
3. `python3 scripts/generate-mindmap.py seq{N}` (필요 시 preset 추가)
4. 신규 시퀀스면 `sequences/index.md` + `.vitepress/config.ts` 업데이트
5. `node scripts/validate-sequence.js` 실행
6. **로컬 dev 서버 기동** — 아래 [로컬 서버](#로컬-서버-자동-기동) 참고
7. 사용자에게 **미리보기 URL** 안내

**수정 후에도 동일** — MD/마인드맵/sidebar 갱신 → validate → dev 서버 확인 → URL 안내.

### 🛑 수동 — 사용자가 배포를 요청할 때만

**커밋·push·배포는 사용자가 명시적으로 요청할 때만** 실행.

배포 요청 시: `npm run build` → git commit → push → Vercel 자동 재배포

---

## MD 포맷 (필수)

템플릿: [sequence-md-template.md](references/sequence-md-template.md)

| 영역 | 규칙 |
|------|------|
| 제목 | `{theme}-{peak_pose}` — 예: `힐링-사마코나사나` |
| 부제 | `**포커스:** … · **피크포즈:** …` (영어 산스크리트名 **금지**) |
| **개요** | **`핵심 cue` 한 줄만** — 테마·총 시간 등 제거 |
| 표 | 3열: 포즈 \| 1depth cue \| 2depth cue — `#` 인덱스 없음 |
| index | `\| 수업 \| 포커스 \| 날짜 \|` — **최신순** |

본문 순서: **개요 → 수업 메모 → 시퀀스 본문 → 마인드맵 → 초기 프롬프트**

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
