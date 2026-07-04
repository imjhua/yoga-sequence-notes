# Vercel 배포

## 사전 조건 (imjhua 계정)

1. **GitHub App 설치**: https://github.com/apps/vercel  
   → imjhua 계정으로 로그인 → `yoga-sequence-notes` repo 접근 허용

2. **Vercel 토큰** (CLI/API용): https://vercel.com/account/tokens

## 방법 A — 대시보드 (권장)

1. https://vercel.com/new → **Import Git Repository**
2. `imjhua/yoga-sequence-notes` 선택
3. 설정:
   - Framework Preset: **Other**
   - Build Command: `npm run build`
   - Output Directory: `.vitepress/dist`
   - Install Command: `npm install`
4. **Deploy**

배포 URL: https://yoga-sequence-notes.vercel.app

## 방법 B — 스크립트 (프로젝트 전용)

```bash
cd ~/Projects/yoga-sequence-notes
chmod +x scripts/setup-vercel.sh
export VERCEL_TOKEN=your_vercel_token   # imjhua 계정 토큰
./scripts/setup-vercel.sh
```

## 빌드 설정 (`vercel.json`)

repo에 포함되어 있음 — 별도 설정 불필요.

## 이후

`main` push → Vercel 자동 재배포

```bash
git push origin main
```

## 로컬 미리보기

```bash
npm run dev
npm run build && npx vitepress preview
```
