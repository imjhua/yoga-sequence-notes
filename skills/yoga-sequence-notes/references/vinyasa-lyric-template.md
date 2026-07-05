# Vinyasa Lyric Flow Template

`theme: 빈야사` — **페이지 1개** (`/sequences/vinyasa/`)에서 선택 · 편집 · 미리보기 · 저장.

## 사이드bar

- **빈야사** → `/sequences/vinyasa/` (이것만)

## 파일

```
sequences/vinyasa/
  index.md              ← <LyricFlowStudio /> (시퀀스 picker 내장)
  manifest.json           ← 목록 + activeId
  {id}.json               ← 시퀀스 데이터 (여러 개)
sequences/prompts/{id}.prompt.txt
public/vinyasa/           ← sync
```

## manifest.json

```json
{
  "activeId": "sign-of-the-times",
  "sequences": [
    { "id": "sign-of-the-times", "title": "Sign of the Times", "updatedAt": "..." }
  ]
}
```

## 에이전트 시드 (새 곡)

```bash
node scripts/build-vinyasa-json.js {id} \
  --song "곡 제목" --artist "아티스트" \
  --prompt {id}.prompt.txt \
  --ko "번역1" "번역2" \
  --active
```

- `{id}.json` + `manifest` 갱신
- `--active` → Studio에서 바로 선택됨
- **MD·sidebar 항목 추가 없음**

## 사용자 (Studio)

1. 상단 **시퀀스** 드롭다운으로 곡 선택
2. 편집 · **미리보기** · **저장** → `{id}.json` + manifest

## 역할

| | 에이전트 | 사용자 |
|---|---------|--------|
| 가사·번역 | 채팅 → JSON 시드 | — |
| inhale/exhale · 강조 · 메모 | — | Studio |
| 저장 | — | JSON + manifest |
