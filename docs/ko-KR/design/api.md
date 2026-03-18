---
source_branch: master
last_sync: 2026-03-18
---

# API 설계

::: warning 번역 안내
이 페이지는 [중국어 원문](../../design/api.md)을 기준으로 정리했습니다. 차이가 있을 경우 원문을 우선합니다.
:::

이 문서는 모메이 백엔드의 상위 API 설계를 설명합니다. 핵심은 인증 방식, 모듈별 라우팅, 데이터 모델 경계, 다국어 콘텐츠와의 연결 구조입니다.

## 1. 기술 기반

- Nitro / Nuxt Server Engine
- better-auth
- TypeORM
- Zod
- Nodemailer
- 애플리케이션 본체 배포는 현재 Node.js, Docker, Vercel을 우선 기준으로 봐야 하며, Cloudflare는 R2 및 Scheduled Events 같은 외곽 기능 연계만 유지됩니다. 따라서 Cloudflare Pages / Workers 전체 배포가 이미 지원된다고 해석하면 안 됩니다.

## 2. 권한 모델

- `admin`, `author`, `user` 중심의 역할 체계를 사용합니다.
- 세션 기반 인증을 우선합니다.
- 권한 로직은 공통 유틸리티에 모아 중복을 줄입니다.

## 3. 라우팅 구조

- 인증, 사용자, 게시글, 분류 / 태그, 댓글, 관리자, AI, 구독, 작업, 시스템 기능 등으로 모듈화됩니다.
- 세부 인터페이스는 개별 모듈 설계 문서에 분산 유지합니다.

## 4. 다국어와 Slug

- `translationId`로 다국어 콘텐츠 묶음을 형성합니다.
- `slug + language` 조합으로 고유성을 유지합니다.
- 언어 전환 시 대응하는 번역 버전을 찾는 데 이 구조를 활용합니다.
