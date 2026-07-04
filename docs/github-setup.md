# imjhua GitHub 설정 (프로젝트 전용)

이 프로젝트만 **imjhua** GitHub 계정을 사용합니다.  
전역 `gh`(github.kakaocorp.com / bella.v) 설정은 변경하지 않습니다.

## 구조

| 파일 | 역할 |
|------|------|
| `.gh/` | imjhua 전용 gh CLI 설정 (gitignore, 토큰 포함) |
| `scripts/imjhua-env.sh` | `GH_CONFIG_DIR` / `GH_HOST` export |
| `scripts/imjhua-gh.sh` | 이 프로젝트 전용 `gh` 래퍼 |
| `scripts/push-to-github.sh` | repo 생성 + push |
| `.git/config` | 로컬 user.name / user.email / sshCommand |

## 1회 설정: imjhua 로그인

```bash
cd ~/Projects/yoga-sequence-notes
chmod +x scripts/*.sh

# imjhua 전용 gh로 github.com 로그인 (브라우저 또는 토큰)
./scripts/imjhua-gh.sh auth login -h github.com -p ssh -s repo,read:org
```

로그인 확인:

```bash
./scripts/imjhua-gh.sh auth status -h github.com
```

## repo 생성 & push

```bash
./scripts/push-to-github.sh
```

## 이후 git push

이 repo의 로컬 git 설정이 imjhua로 고정되어 있으므로 일반 push:

```bash
git push origin main
```

## gh 명령 (이 프로젝트에서만)

전역 `gh` 대신 항상 래퍼 사용:

```bash
./scripts/imjhua-gh.sh repo view imjhua/yoga-sequence-notes
./scripts/imjhua-gh.sh pr list
```

## Git identity (이 repo만)

```
user.name  = imjhua
user.email = 49778658+imjhua@users.noreply.github.com
sshCommand = ssh -i ~/.ssh/id_rsa -o IdentitiesOnly=yes
```

다른 프로젝트(kakaocorp)에는 영향 없음.

## Vercel

1. https://vercel.com → Import `imjhua/yoga-sequence-notes`
2. Output Directory: `.vitepress/dist`
3. `main` push 시 자동 배포

또는 imjhua Vercel 계정으로:

```bash
source scripts/imjhua-env.sh
npx vercel --prod
```

(Vercel도 별도 계정이면 프로젝트 루트에 `.vercel/`이 생기며 gitignore 처리됨)
