# Publish Workflow

## 자동 vs 수동

| 단계 | 트리거 | 에이전트 행동 |
|------|--------|---------------|
| MD·마인드맵·sidebar 작성 | 시퀀스 **입력 또는 수정** | **즉시 자동** |
| validate | 파일 생성/수정 후 | **즉시 자동** |
| `npm run dev` | 파일 생성/수정 후 | **즉시 자동** (미기동 시) |
| git commit & push | 사용자 **배포 요청** | 수동 |
| Vercel 배포 | push 후 | 자동 (Vercel 연동) |

---

## [자동] Step 1–5 — 로컬 미리보기까지

### 1. 입력 저장

```bash
sequences/prompts/seq{N}-{peak-slug}.prompt.txt
```

### 2. MD 작성/수정

```bash
sequences/seq{N}-{peak-slug}.md
```

템플릿: [sequence-md-template.md](sequence-md-template.md)

### 3. 마인드맵

```bash
python3 scripts/generate-mindmap.py seq{N}
```

### 4. index + sidebar (신규만)

- `sequences/index.md`
- `.vitepress/config.ts`

### 5. 검증 & dev 서버

```bash
cd ~/Projects/yoga-sequence-notes
node scripts/validate-sequence.js
npm run dev    # 백그라운드, 이미 실행 중이면 생략
```

→ 사용자에게 `http://localhost:5173/sequences/seq{N}-{slug}` 안내

**수정 후**: Step 2–5 반복. 커밋/배포는 하지 않음.

---

## [수동] Step 6–8 — 배포 (사용자 요청 시)

사용자가 "배포해줘", "커밋하고 올려줘" 등 **명시적으로 요청**한 경우에만.

### 6. 빌드 확인

```bash
npm run build
```

### 7. Git commit & push

```bash
git add \
  sequences/ \
  public/mindmaps/ \
  .vitepress/config.ts \
  scripts/generate-mindmap.py   # preset 변경 시

git commit -m "$(cat <<'EOF'
Add yoga sequence: {title}

EOF
)"
# 수정 시: Update yoga sequence: {title}

git push origin main
```

imjhua 전용: `./scripts/imjhua-gh.sh`, repo `docs/github-setup.md`

### 8. 배포 확인

- push → Vercel 자동 재배포 (1~2분)
- https://yoga-sequence-notes.vercel.app/sequences/seq{N}-{slug}
- 마인드맵 · CopyPrompt · 모바일 표 스크롤 확인

---

## 한 줄 요약

```
[자동]  입력/수정 → files → validate → npm run dev → URL 안내
[수동]  "배포해줘" → build → commit → push → Vercel
```
