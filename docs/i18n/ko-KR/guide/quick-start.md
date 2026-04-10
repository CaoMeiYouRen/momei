---
source_branch: master
last_sync: 2026-03-18
---

# 빠른 시작

::: warning 번역 안내
이 페이지는 [중국어 원문](../../../guide/quick-start.md)을 기준으로 정리했습니다. 차이가 있을 경우 원문을 우선합니다.
:::

이 문서는 모메이를 가장 빠르게 배포하고 실행하는 방법을 안내합니다. 공개 사이트를 먼저 올리고 싶은 경우와 로컬 개발을 바로 시작하고 싶은 경우 모두를 고려해 경로를 나누었습니다.

## 0. 최소 실행 경로

첫 배포에서 AI, 스토리지, 메일, 알림을 한 번에 모두 맞추려 하지 마세요. 먼저 하나의 최소 경로를 끝까지 통과시키고, 이후에 기능을 확장하는 편이 안전합니다.

| 경로 | 언제 선택할지 | 첫 실행 전에 최소 확인 사항 | 나중에 미뤄도 되는 것 |
| :--- | :--- | :--- | :--- |
| 로컬 개발 | 화면을 먼저 보고 싶거나 코드를 수정하고 싶을 때 | `pnpm install`, `pnpm dev`; 개발 모드는 임시 `AUTH_SECRET`와 로컬 SQLite를 자동 보완 | AI, 객체 스토리지, 메일, 예약 작업 |
| Vercel | 가장 빨리 공개 가능한 사이트를 띄우고 싶을 때 | `AUTH_SECRET`, `NUXT_PUBLIC_SITE_URL`, `NUXT_PUBLIC_AUTH_BASE_URL`, 외부 `DATABASE_URL` | AI, 객체 스토리지, 메일, 분석 |
| Docker / 자가 호스팅 Node | 디스크 제어와 운영 가시성이 더 필요할 때 | `AUTH_SECRET`, `NUXT_PUBLIC_SITE_URL`, `NUXT_PUBLIC_AUTH_BASE_URL`; SQLite를 유지한다면 DB 경로나 마운트가 영속적인지 확인 | AI, 객체 스토리지, 메일, 분석 |

첫 실행 전 권장 점검 순서:

1. 본배포라면 `AUTH_SECRET`, `NUXT_PUBLIC_SITE_URL`, `NUXT_PUBLIC_AUTH_BASE_URL`부터 먼저 채웁니다.
2. Vercel 같은 Serverless 경로에서는 기본 SQLite를 계속 쓰지 마세요. Cloudflare Pages / Workers는 전체 앱 런타임 대상이 아직 아닙니다.
3. Serverless에서 `STORAGE_TYPE=local`을 남겨두면 이후 업로드와 미디어 흐름이 실패합니다.
4. 설치 마법사에 blocker가 나오면 [배포 가이드](./deploy.md)와 [변수 및 설정 매핑](./variables.md)을 먼저 대조하세요.

## 1. Vercel 원클릭 배포

가장 빠르게 공개 가능한 사이트를 만들고 싶다면 이 경로가 가장 단순합니다.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCaoMeiYouRen%2Fmomei)

1. 위 버튼을 클릭합니다.
2. Vercel 안내에 따라 GitHub 저장소를 선택하거나 생성합니다.
3. 최소한 `AUTH_SECRET`, `NUXT_PUBLIC_SITE_URL`, `NUXT_PUBLIC_AUTH_BASE_URL`, 외부 `DATABASE_URL`을 입력합니다.
4. `Deploy`를 눌러 배포를 완료합니다.

공개 운영을 준비한다면 배포 직후 `AUTH_SECRET`, 사이트 URL, 데이터베이스 연결 값을 우선 보강하는 것이 좋습니다.

## 2. Docker로 빠르게 배포

모메이는 공식 Docker 이미지를 제공하므로 VPS, 자가 서버, 컨테이너 플랫폼 환경에 쉽게 배포할 수 있습니다.

### 2.1 기본 실행

```bash
docker run -d -p 3000:3000 caomeiyouren/momei
```

운영 환경이라면 최소한 다음을 추가하세요.

```bash
docker run -d -p 3000:3000 \
    -e AUTH_SECRET=your-random-secret \
    -e NUXT_PUBLIC_SITE_URL=https://blog.example.com \
    -e NUXT_PUBLIC_AUTH_BASE_URL=https://blog.example.com \
    caomeiyouren/momei
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

## 3. Cloudflare 외곽 기능 연계만 지원

현재 버전은 애플리케이션 본체를 Cloudflare Pages / Workers에 완전 배포하는 것을 지원하지 않습니다. 프로젝트가 아직 TypeORM과 Node 런타임 기능에 의존하고 있어 유지 가능한 Cloudflare 적응 계층이 없기 때문입니다.

Cloudflare가 필요하다면 현재는 다음과 같은 외곽 기능에만 한정하는 것을 권장합니다.

- Cloudflare R2를 객체 스토리지로 사용
- Cloudflare Scheduled Events 관련 트리거 적응 설계를 통해 통합 작업 진입점을 평가
- CDN, WAF, DNS처럼 메인 앱 런타임과 분리된 엣지 기능 활용

애플리케이션 본체는 Vercel, Docker, 또는 자체 호스팅 Node 환경에 두고, 추가 Cloudflare 활용 여부는 [배포 가이드](./deploy.md)에서 판단하세요.

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

다만 이 zero-config 경험은 로컬 개발 전용입니다. 공개 배포, OAuth 콜백, 절대 공개 URL이 필요해지는 시점에는 위 최소 경로로 돌아가 핵심 변수를 명시적으로 채워야 합니다.

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
