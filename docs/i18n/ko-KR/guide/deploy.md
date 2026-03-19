---
source_branch: master
last_sync: 2026-03-18
---

# 배포 가이드

::: warning 번역 안내
이 페이지는 [중국어 원문](../../../guide/deploy.md)을 기준으로 정리했습니다. 차이가 있을 경우 원문을 우선합니다.
:::

모메이의 배포 설정은 환경 변수를 중심으로 구성됩니다. 인증, 예약 작업, 객체 스토리지처럼 운영 민감도가 높은 기능은 특히 배포 계층에서 관리하는 것이 좋습니다.

## 1. 필수 설정

다음 값이 없으면 실행 자체가 어렵거나 인증, 공개 URL, 데이터베이스 초기화 과정에서 문제가 발생합니다.

- `AUTH_SECRET`
- `NUXT_PUBLIC_SITE_URL`
- `NUXT_PUBLIC_AUTH_BASE_URL`
- `DATABASE_URL`

데이터베이스는 SQLite, MySQL, PostgreSQL 등을 사용할 수 있습니다.

## 2. 운영 권장 설정

### 2.1 데이터베이스와 캐시

- `DATABASE_SYNCHRONIZE=false`
- `REDIS_URL`

### 2.2 AI / 멀티모달

- `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`
- `AI_API_ENDPOINT`
- `AI_HEAVY_TASK_TIMEOUT`
- `AI_TEXT_DIRECT_RETURN_MAX_CHARS`, `AI_TEXT_TASK_CHUNK_SIZE`, `AI_TEXT_TASK_CONCURRENCY`
- `AI_IMAGE_*`, `ASR_*`, `TTS_*`
- `AI_QUOTA_ENABLED`, `AI_QUOTA_POLICIES`, `AI_ALERT_THRESHOLDS`

### 2.3 스토리지와 자산

- `STORAGE_TYPE`은 `local`, `s3`, `r2`, `vercel_blob` 중 하나를 권장합니다.
- S3 / R2 계열은 브라우저 직업로드를 우선 지원합니다.
- `ASSET_PUBLIC_BASE_URL`, `ASSET_OBJECT_PREFIX`로 공개 경로와 객체 prefix를 통합할 수 있습니다.

### 2.4 이메일과 작업 자동화

- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`
- `CRON_SECRET`, `TASKS_TOKEN`, `WEBHOOK_SECRET`
- `TASK_CRON_EXPRESSION`, `DISABLE_CRON_JOB`

## 3. 플랫폼별 추천

- **Vercel**: Serverless 배포에 적합하며 `CRON_SECRET` 설정을 권장합니다.
- **Docker / 자가 호스팅**: 로컬 디스크와 자체 cron 제어가 필요한 경우 적합합니다.
- **Cloudflare(외곽 기능 연계)**: 현재 버전은 TypeORM 및 Node 런타임 의존성 때문에 애플리케이션 본체를 Cloudflare Pages / Workers에 완전 배포할 수 없습니다. 다만 Cloudflare R2는 계속 객체 스토리지로 사용할 수 있으며, Scheduled Events 관련 트리거 적응과 `wrangler.toml`은 외곽 기능 설계 / 실험 진입점으로만 유지됩니다. `pnpm deploy:wrangler` 역시 wrangler 측 적응 디버깅 용도일 뿐, 운영 환경의 전체 사이트 배포 명령으로 보면 안 됩니다.

## 4. 자주 겪는 문제

- 인증 콜백 오류: 공개 URL과 Auth base URL의 프로토콜 / 도메인을 맞춥니다.
- 작업 API 401: 현재 사용 중인 인증 방식이 `CRON_SECRET`, `TASKS_TOKEN`, `WEBHOOK_SECRET` 중 무엇인지 확인합니다.
- ASR / AI 호환 API 오류: endpoint에 `/v1`가 필요한지 확인합니다.
- 직업로드가 프록시 업로드로 떨어짐: `STORAGE_TYPE`과 버킷 자격 증명을 점검합니다.
- Cloudflare Pages / Workers에서 TypeORM 또는 Node 호환성 오류가 발생함: 배포 절차 누락이 아니라 현재 플랫폼 경계입니다. 메인 앱은 Vercel, Docker, 또는 자체 호스팅 Node 환경에 두고, Cloudflare는 R2나 Scheduled Events 관련 실험 같은 외곽 기능으로만 사용하세요.

## 5. 함께 읽기

- [변수 및 설정 매핑](./variables.md)
- [빠른 시작](./quick-start.md)
- [API 설계](../design/api.md)
