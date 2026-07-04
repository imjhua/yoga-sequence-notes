# Yoga Sequence Notes

요가 수업 시퀀스를 **마크다운 + 마인드맵 이미지**로 정리하고 VitePress로 보여주는 정적 사이트.

## 구조

```
sequences/
├── index.md
├── seq0-urdhva-dhanurasana.md
└── seq1-samakonasana.md
public/sequences/assets/     ← 마인드맵 SVG/PNG (정적 파일)
```

## 로컬 실행

```bash
npm install
npm run dev
```

## 모바일 (수업 중 핸드폰)

- VitePress 기본: 햄버거 메뉴, 반응형 레이아웃
- `.vitepress/theme/custom.css`: 표 가로 스크롤, 본문 글자 크기, 마인드맵 터치 스크롤
- **마인드맵 SVG**: 글자 11px 이상 권장 (작으면 핀치 확대)
- **표**: 포즈명 열이 넓으면 가로 스와이프

로컬에서 모바일 확인: Chrome DevTools → 기기 툴바 (375px)

## 시퀀스 추가

1. `sequences/seq{N}-{slug}.md` 작성 (본문에 `![마인드맵](./assets/...)` 삽입)
2. `public/sequences/assets/` 에 마인드맵 이미지 (SVG/PNG) 저장
3. MD 본문: `![마인드맵](/sequences/assets/seq{N}-mindmap.svg)`

## 배포 (Vercel)

상세: [docs/vercel-setup.md](docs/vercel-setup.md)

1. https://github.com/apps/vercel → imjhua 계정에 설치
2. https://vercel.com/new → `imjhua/yoga-sequence-notes` import
3. Output Directory: `.vitepress/dist`

또는:

```bash
export VERCEL_TOKEN=your_token
./scripts/setup-vercel.sh
```

에이전트 스킬: `~/.claude/skills/yoga-sequence/SKILL.md`
