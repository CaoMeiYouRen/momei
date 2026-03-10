---
source_branch: master
last_sync: 2026-03-10
---

# 빠른 시작

::: warning 번역 안내
이 페이지는 [중국어 원문](../../guide/quick-start.md)과 영어 문서를 참고해 정리했습니다. 차이가 있을 경우 중국어 원문을 우선합니다.
:::

모메이에 오신 것을 환영합니다. 이 가이드는 블로그를 가장 빠르게 배포하고 실행하는 방법을 안내합니다.

## 1. Vercel 원클릭 배포

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCaoMeYouRen%2Fmomei)

1. 위 버튼을 클릭합니다.
2. Vercel 안내에 따라 GitHub 저장소를 선택하거나 생성합니다.
3. 필요하면 환경 변수를 설정합니다.
4. `Deploy`를 누릅니다.

## 2. Docker로 빠르게 실행

### 2.1 기본 실행

```bash
docker run -d -p 3000:3000 caomeiyouren/momei
```

### 2.2 Docker Compose 사용

```yaml
version: "3.8"
services:
    momei:
        image: caomeiyouren/momei
        ports:
            - "3000:3000"
        environment:
            - NODE_ENV=production
            - AUTH_SECRET=your-random-secret-key
        volumes:
            - ./database:/app/database
            - ./uploads:/app/public/uploads
```

실행 명령:

```bash
docker-compose up -d
```

## 3. 로컬 개발

```bash
git clone https://github.com/CaoMeiYouRen/momei.git
cd momei
pnpm install
pnpm dev
```

개발 모드에서는 별도 설정 없이 다음이 자동으로 준비됩니다.

- 로컬 SQLite 사용
- 개발용 `AUTH_SECRET` 자동 생성
- `.env` 없이도 실행 가능

## 4. 다음 단계

- `/admin`으로 이동해 관리자 화면에 로그인합니다.
- `AI_API_KEY`를 설정해 AI 기능을 활성화합니다.
- `MEMOS_ENABLED=true`, `MEMOS_INSTANCE_URL`, `MEMOS_ACCESS_TOKEN`을 설정해 Memos 동기화를 켭니다.
- `NUXT_PUBLIC_DEMO_MODE=true`로 데모 모드를 체험합니다.
