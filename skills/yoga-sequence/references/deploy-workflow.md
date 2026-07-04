# Vercel Deploy Workflow

## Repo & URL

| 항목 | 값 |
|------|-----|
| GitHub | `imjhua/yoga-sequence-notes` |
| 로컬 | `~/Projects/yoga-sequence-notes` |
| Production | https://yoga-sequence-notes.vercel.app |
| imjhua gh | `./scripts/imjhua-gh.sh` (전역 gh와 분리) |

## 토큰 구분 (중요)

| 용도 | 토큰 | 발급 |
|------|------|------|
| git push | GitHub PAT / SSH | github.com/settings/tokens |
| Vercel CLI | **Vercel token** | vercel.com/account/tokens |

⚠️ GitHub `ghp_...` 토큰을 `VERCEL_TOKEN`으로 쓰면 **403** 발생.

## 최초 설정 (imjhua 1회)

### GitHub

```bash
cd ~/Projects/yoga-sequence-notes
./scripts/imjhua-gh.sh auth login -h github.com -p ssh -s repo,read:org
./scripts/push-to-github.sh
```

### Vercel — 방법 A: 대시보드 (권장)

1. https://github.com/apps/vercel → imjhua 계정, repo 접근 허용
2. https://vercel.com/new → `imjhua/yoga-sequence-notes` import
3. 설정:
   - Framework Preset: **Other**
   - Build Command: `npm run build`
   - Output Directory: `.vitepress/dist`
   - Install Command: `npm install`
4. **Deploy**

`vercel.json`이 repo에 있으면 위 설정이 자동 적용됨.

### Vercel — 방법 B: 스크립트

```bash
export VERCEL_TOKEN=your_vercel_token   # Vercel 사이트에서 발급
chmod +x scripts/setup-vercel.sh
./scripts/setup-vercel.sh
```

## 이후 배포 (일반 워크플로)

`main` 브랜치 push → Vercel **자동 재배포**

```bash
node scripts/validate-sequence.js
npm run build
git push origin main
```

1~2분 후 Production URL에서 확인.

## 수동 배포

```bash
npx vercel --prod
```

## 배포 전 체크리스트

- [ ] `node scripts/validate-sequence.js` 통과
- [ ] `npm run build` 성공
- [ ] Vercel Output Directory = `.vitepress/dist`
- [ ] Production URL에서 MD + `/mindmaps/*.svg` 표시
- [ ] CopyPrompt 복사 버튼 동작

## 로컬 미리보기

```bash
npm run dev
npm run build && npx vitepress preview
```
