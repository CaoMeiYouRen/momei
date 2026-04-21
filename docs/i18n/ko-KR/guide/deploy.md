---
source_branch: master
last_sync: 2026-04-21
translation_tier: summary-sync
---

# 배포 가이드

::: warning 번역 안내
이 페이지는 [중국어 원문](../../../guide/deploy.md)을 기준으로 정리했습니다. 차이가 있을 경우 원문을 우선합니다.
:::

모메이의 배포 설정은 환경 변수를 중심으로 구성됩니다. 인증, 예약 작업, 객체 스토리지처럼 운영 민감도가 높은 기능은 특히 배포 계층에서 관리하는 것이 좋습니다.

## 0. 배포 전 프리플라이트

첫 배포에서는 모든 설정을 한 번에 채우기보다 다음 순서로 확인하세요.

1. 먼저 배포 경로를 정합니다.
	- 로컬 개발: zero-config 시작은 가능하지만 개발 확인용입니다.
	- Vercel: 외부 `DATABASE_URL`로 전환하고 기본 SQLite를 유지하지 마세요.
	- Docker / 자가 호스팅 Node: SQLite는 계속 사용할 수 있지만 DB와 업로드 디렉터리 영속성을 먼저 확인해야 합니다.
	- Cloudflare Pages / Workers: 전체 앱 런타임은 아직 미지원이며 R2, Scheduled Events 같은 외곽 통합에만 한정해야 합니다.
2. 다음으로 핵심 변수를 채웁니다.
	- 운영 배포는 `AUTH_SECRET`, `NUXT_PUBLIC_SITE_URL`, `NUXT_PUBLIC_AUTH_BASE_URL`을 최우선으로 채워야 합니다.
	- `NUXT_PUBLIC_SITE_URL`과 `NUXT_PUBLIC_AUTH_BASE_URL`은 보통 같은 origin을 유지해야 합니다.
3. 마지막으로 조합 충돌을 확인합니다.
	- Serverless + SQLite: 재배포나 재시작 후 데이터가 사라질 수 있어 운영 경로로 부적절합니다.
	- Serverless + `STORAGE_TYPE=local`: 사이트는 뜰 수 있어도 업로드와 미디어 처리에 실패합니다.
	- 데이터베이스 연결 실패: `DATABASE_URL`, SQLite 경로 권한, Docker 마운트, 외부 DB 접근 가능 여부를 먼저 확인합니다.

설치 마법사 1단계에서 blocker가 보이면 DB 초기화나 관리자 생성 전에 먼저 그 blocker를 해소하세요.

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
- `TASK_CRON_EXPRESSION`: 자가 호스팅에서 메인 작업 주기를 덮어씁니다. 메인 작업은 게시글 / 마케팅 스케줄링과 AI 미디어 timeout 보상을 함께 담당합니다.
- `FRIEND_LINKS_CHECK_CRON`: 자가 호스팅에서 친구 링크 점검용 독립 cron을 덮어씁니다. 기본은 UTC 02:00 하루 1회입니다.
- `DISABLE_CRON_JOB`
- `FRIEND_LINKS_CHECK_INTERVAL_MINUTES`: 친구 링크 점검 최소 간격. 최종값은 60분 아래로 내려가지 않습니다.
- `FRIEND_LINKS_CHECK_BATCH_SIZE`: 1회 점검 배치 크기. 기본 `20`.
- `FRIEND_LINKS_CHECK_TIMEOUT_MS`: 사이트별 probe timeout. 기본 `8000`ms.
- `FRIEND_LINKS_FAILURE_BACKOFF_MAX_MINUTES`: 연속 실패 사이트의 최대 냉각 시간. 기본 `10080`분(7일).
- `FRIEND_LINKS_AUTO_DISABLE_FAILURE_THRESHOLD`: 연속 실패가 임계값에 도달하면 `inactive`로 자동 전환할 수 있습니다. 기본은 비활성화입니다.

`WEBHOOK_TIMESTAMP_TOLERANCE`는 예시 파일에 아직 남아 있지만 현재 구현은 읽지 않습니다. webhook 검증은 고정 5분 허용 오차를 사용합니다.

현재 작업 진입점 역할은 다음처럼 정리됩니다.

- Vercel / Cloudflare / 수동 webhook 진입점은 게시글 스케줄링, 마케팅 스케줄링, AI 미디어 timeout 보상, 친구 링크 점검을 통합 실행합니다.
- 자가 호스팅에서는 메인 cron이 게시글 / 마케팅 스케줄링과 AI 미디어 보상을 담당하고, 친구 링크 점검은 별도 cron으로 유지되어 기본 5분 메인 주기를 그대로 따르지 않습니다.

친구 링크 점검은 최소 간격을 넘기고 실패 냉각 구간에 있지 않은 기록만 probe 합니다. AI 미디어 보상은 timeout 이후 오래 stale 상태인 이미지 생성 / 팟캐스트 작업만 스캔하고, 저장된 checkpoint를 바탕으로 이어 실행하거나 마무리합니다.

## 3. 플랫폼별 추천

- **Vercel**: Serverless 배포에 적합하며 `CRON_SECRET` 설정을 권장합니다.
- **Docker / 자가 호스팅**: 로컬 디스크와 자체 cron 제어가 필요한 경우 적합합니다.
- **Cloudflare(외곽 기능 연계)**: 현재 버전은 TypeORM 및 Node 런타임 의존성 때문에 애플리케이션 본체를 Cloudflare Pages / Workers에 완전 배포할 수 없습니다. 다만 Cloudflare R2는 계속 객체 스토리지로 사용할 수 있으며, Scheduled Events 관련 트리거 적응과 `wrangler.toml`은 외곽 기능 설계 / 실험 진입점으로만 유지됩니다. `pnpm deploy:wrangler` 역시 wrangler 측 적응 디버깅 용도일 뿐, 운영 환경의 전체 사이트 배포 명령으로 보면 안 됩니다.
- **Cloudflare(외곽 기능 연계)**: 현재 버전은 TypeORM 및 Node 런타임 의존성 때문에 애플리케이션 본체를 Cloudflare Pages / Workers에 완전 배포할 수 없습니다. 현재 연구 및 손절 결론은 [Cloudflare 런타임 호환성 연구 및 손절 결론](../../design/governance/cloudflare-runtime-study.md)에 정리되어 있습니다. Cloudflare R2는 계속 객체 스토리지로 사용할 수 있으며, Scheduled Events 관련 트리거 적응과 `wrangler.toml`은 외곽 기능 설계 / 실험 진입점으로만 유지됩니다. `pnpm deploy:wrangler` 역시 wrangler 측 적응 디버깅 용도일 뿐, 운영 환경의 전체 사이트 배포 명령으로 보면 안 됩니다.

## 4. 자주 겪는 문제

- 설치 마법사 1단계에서 멈춤: 먼저 마법사에 표시된 배포 경로와 blocker 요약을 확인한 뒤, 이 페이지의 프리플라이트와 필수 설정을 대조하세요.
- 인증 콜백 오류: 공개 URL과 Auth base URL의 프로토콜 / 도메인을 맞춥니다.
- 작업 API 401: 현재 사용 중인 인증 방식이 `CRON_SECRET`, `TASKS_TOKEN`, `WEBHOOK_SECRET` 중 무엇인지 확인합니다.
- ASR / AI 호환 API 오류: endpoint에 `/v1`가 필요한지 확인합니다.
- 직업로드가 프록시 업로드로 떨어짐: `STORAGE_TYPE`과 버킷 자격 증명을 점검합니다.
- Vercel / Netlify에서 첫 부팅 후 데이터나 관리자 계정이 사라짐: 아직 기본 SQLite를 쓰고 있는지 확인하세요. Serverless 경로는 외부 `DATABASE_URL`로 전환해야 합니다.
- Vercel / Netlify에서 사이트는 열리지만 업로드가 실패함: 대부분 `STORAGE_TYPE=local`이 남아 있는 경우입니다. `s3`, `r2`, `vercel_blob`로 바꾸세요.
- Cloudflare Pages / Workers에서 TypeORM 또는 Node 호환성 오류가 발생함: 배포 절차 누락이 아니라 현재 플랫폼 경계입니다. 메인 앱은 Vercel, Docker, 또는 자체 호스팅 Node 환경에 두고, Cloudflare는 R2나 Scheduled Events 관련 실험 같은 외곽 기능으로만 사용하세요.
- Cloudflare D1이 현재 데이터베이스를 바로 대체할 수 있는가: 아닙니다. 현재 주 스택은 여전히 TypeORM과 `sqlite/mysql/postgres` 드라이버 조합을 전제로 하며, D1은 이후 조건부 연구 항목일 뿐 정식 지원 경로가 아닙니다.

## 5. 함께 읽기

- [변수 및 설정 매핑](./variables.md)
- [빠른 시작](./quick-start.md)
- [API 설계](../design/api.md)
