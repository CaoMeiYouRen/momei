---
source_branch: master
last_sync: 2026-03-10
---

# 배포 가이드

::: warning 번역 안내
이 페이지는 [중국어 원문](../../guide/deploy.md)과 [영문판](../../en-US/guide/deploy.md)을 바탕으로 정리했습니다. 차이가 있을 경우 중국어 원문을 우선합니다.
:::

## 1. 지원하는 배포 방식

- Vercel: 가장 빠르게 공개 사이트를 올릴 수 있는 호스팅 방식
- Docker / Docker Compose: 자체 서버와 프라이빗 배포에 적합
- Cloudflare: 엣지 기반 Serverless 시나리오에 적합

## 2. 배포 전 체크리스트

- `AUTH_SECRET` 과 기본 인증 설정 준비
- 데이터베이스, 업로드 파일, 정적 자산 저장소 계획 점검
- AI, 이메일, 알림 등 선택 기능의 환경 변수 확인

## 3. 권장 순서

1. [빠른 시작](./quick-start.md) 확인
2. [변수 및 설정 매핑](./variables.md) 확인
3. 세부 배포 절차는 [중국어 원문](../../guide/deploy.md) 참고