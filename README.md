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

로컬 미리보기: `npm run dev` 실행 후 브라우저에서 확인.

## 시퀀스 추가

1. `sequences/seq{N}-{slug}.md` 작성 (본문에 `![마인드맵](./assets/...)` 삽입)
2. `public/sequences/assets/` 에 마인드맵 이미지 (SVG/PNG) 저장
3. MD 본문: `![마인드맵](/sequences/assets/seq{N}-mindmap.svg)`

## 배포

GitHub push → Vercel 자동 배포 (`vercel.json` 포함)

**imjhua 계정 (이 프로젝트 전용):** [docs/github-setup.md](docs/github-setup.md)

```bash
# 최초 1회
./scripts/imjhua-gh.sh auth login -h github.com -p ssh -s repo,read:org

# repo 생성 & push
./scripts/push-to-github.sh
```

```bash
npm run build
npx vercel --prod
```

에이전트 스킬: `~/.claude/skills/yoga-sequence/SKILL.md`
