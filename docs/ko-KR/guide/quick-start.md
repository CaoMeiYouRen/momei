---
source_branch: master
last_sync: 2026-03-10
---

# 빠른 시작

::: warning 번역 안내
이 페이지는 [중국어 원문](../../guide/quick-start.md)을 기준으로 정리했습니다. 차이가 있을 경우 원문을 우선합니다.
:::

이 문서는 모메이를 가장 빠르게 배포하고 실행하는 방법을 안내합니다. 공개 사이트를 먼저 올리고 싶은 경우와 로컬 개발을 바로 시작하고 싶은 경우 모두를 고려해 경로를 나누었습니다.

## 1. Vercel 원클릭 배포

가장 빠르게 공개 가능한 사이트를 만들고 싶다면 이 경로가 가장 단순합니다.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCaoMeiYouRen%2Fmomei)

1. 위 버튼을 클릭합니다.
2. Vercel 안내에 따라 GitHub 저장소를 선택하거나 생성합니다.
3. 필요에 따라 환경 변수를 입력합니다.
4. `Deploy`를 눌러 배포를 완료합니다.

공개 운영을 준비한다면 배포 직후 `AUTH_SECRET`, 사이트 URL, 데이터베이스 연결 값을 우선 보강하는 것이 좋습니다.

## 2. Docker로 빠르게 배포

모메이는 공식 Docker 이미지를 제공하므로 VPS, 자가 서버, 컨테이너 플랫폼 환경에 쉽게 배포할 수 있습니다.

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

## 3. Cloudflare 배포

가벼운 엣지 런타임 기반 Serverless 경험을 원한다면 다음 경로를 사용할 수 있습니다.

```bash
pnpm build
pnpm deploy:wrangler
```

Cloudflare 환경에서의 스토리지 조합과 스케줄드 트리거 관련 내용은 [배포 가이드](./deploy.md)를 함께 확인하세요.

## 4. 로컬 개발 시작

```bash
git clone https://github.com/CaoMeiYouRen/momei.git
cd momei
pnpm install
pnpm dev
```

로컬 개발 모드에서는 별도 설정 없이도 다음이 자동으로 준비됩니다.

- 로컬 SQLite 데이터베이스 사용
- 개발용 `AUTH_SECRET` 자동 생성
- `.env` 없이도 기본 실행 가능

완전한 기능을 시험하려면 `.env.full.example`을 기준으로 설정을 확장하고, 특히 AI, 스토리지, Memos 관련 환경 변수를 함께 맞추는 것이 좋습니다.

## 5. 다음 단계

- `/admin`에 접속해 관리자 화면을 확인합니다.
- `AI_API_KEY`를 설정해 제목, 요약, 번역 기능을 활성화합니다.
- `MEMOS_ENABLED=true`, `MEMOS_INSTANCE_URL`, `MEMOS_ACCESS_TOKEN`을 설정해 Memos 동기화를 켭니다.
- `NUXT_PUBLIC_DEMO_MODE=true`로 데모 모드를 체험합니다.

---

::: tip 팁
정식 배포를 준비한다면 [배포 가이드](./deploy.md)와 [변수 및 설정 매핑](./variables.md)을 이어서 읽는 것을 권장합니다.
:::