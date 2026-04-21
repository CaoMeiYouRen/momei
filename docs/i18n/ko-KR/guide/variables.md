---
source_branch: master
last_sync: 2026-04-21
---

# 변수 및 설정 매핑

::: warning 번역 안내
이 페이지는 [중국어 원문](../../../guide/variables.md)을 기준으로 정리했습니다. 차이가 있을 경우 원문을 우선합니다.
:::

이 문서는 환경 변수, `SettingKey`, 노출 등급, 마스킹 규칙이 어떻게 연결되는지를 설명합니다. 배포 설정과 관리자 화면을 함께 다루는 프로젝트이기 때문에 이 매핑을 이해하는 것이 중요합니다.

## 1. 설정 우선순위

모메이는 기본적으로 **환경 변수 우선** 정책을 사용합니다.

1. 환경 변수
2. 데이터베이스 설정
3. 코드 기본값

이미 ENV로 잠긴 항목은 관리자 화면에서 읽기 전용처럼 보일 수 있습니다.

## 2. 주요 설정 그룹

### 2.1 기본 핵심

- `NUXT_PUBLIC_APP_NAME`
- `NUXT_PUBLIC_SITE_URL`
- `NUXT_PUBLIC_AUTH_BASE_URL`
- `AUTH_SECRET`
- `NUXT_PUBLIC_CONTACT_EMAIL`

### 2.2 AI 및 멀티모달

- `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, `AI_API_ENDPOINT`
- `AI_QUOTA_ENABLED`, `AI_QUOTA_POLICIES`, `AI_ALERT_THRESHOLDS`
- `ASR_*`, `TTS_*`, `AI_IMAGE_*`

### 2.3 저장소와 데이터베이스

- `DATABASE_URL`
- `REDIS_URL`
- `STORAGE_TYPE`
- `LOCAL_STORAGE_*`
- `S3_*`
- `CLOUDFLARE_R2_*`
- `ASSET_PUBLIC_BASE_URL`, `ASSET_OBJECT_PREFIX`
- `BLOB_READ_WRITE_TOKEN`

### 2.4 인증, 작업, 서드파티

- `ALLOW_REGISTRATION`, `ENABLE_CAPTCHA`
- `CRON_SECRET`, `TASKS_TOKEN`, `WEBHOOK_SECRET`
- `MEMOS_ENABLED`, `MEMOS_INSTANCE_URL`, `MEMOS_ACCESS_TOKEN`
- `HEXO_SYNC_ENABLED`, `HEXO_SYNC_PROVIDER`, `HEXO_SYNC_OWNER`, `HEXO_SYNC_REPO`
- `HEXO_SYNC_BRANCH`, `HEXO_SYNC_POSTS_DIR`, `HEXO_SYNC_ACCESS_TOKEN`

참고: `HEXO_SYNC_*` 는 이제 관리자 화면의 시스템 설정 > 통합 섹션에서 관리할 수 있습니다. `HEXO_SYNC_ACCESS_TOKEN` 은 UI 에서 마스킹되며, 동일한 환경 변수가 배포 계층에 있으면 계속 ENV 잠금 상태로 읽기 전용을 유지합니다.

## 3. 운영 시 유의점

- `AUTH_SECRET`, `DATABASE_URL`, `REDIS_URL`, `HEXO_SYNC_ACCESS_TOKEN` 같은 항목은 항상 배포 계층에서 관리해야 합니다.
- 일부 항목은 관리자 화면에서 수정 가능하지만, 저장소 드라이버처럼 재시작이 필요한 경우도 있습니다.
- 다국어, AI, 알림, 예약 작업과 엮인 설정은 관련 설계 문서를 함께 읽어야 합니다.
