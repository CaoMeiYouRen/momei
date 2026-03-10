---
source_branch: master
last_sync: 2026-03-10
---

# 개발 가이드

::: warning 번역 안내
이 페이지는 [중국어 원문](../../guide/development.md)과 [영문판](../../en-US/guide/development.md)을 바탕으로 정리했습니다. 차이가 있을 경우 중국어 원문을 우선합니다.
:::

## 1. 로컬 개발 기본 흐름

- 의존성 설치: `pnpm install`
- 개발 서버 실행: `pnpm dev`
- lint 실행: `pnpm lint`
- 타입 검사: `pnpm typecheck`

## 2. 개발 시 유의점

- 기존 Nuxt, TypeScript, SCSS, i18n 구조를 우선 재사용합니다.
- 기능 변경 후에는 테스트, 문서, todo 상태를 함께 갱신합니다.
- 다국어 변경 시 locale parity, 이메일 locale, 문서 사이트 경로를 함께 확인합니다.

## 3. 관련 문서

- [변수 및 설정 매핑](./variables.md)
- [AI 주도 개발 가이드](./ai-development.md)
- [중국어 개발 가이드](../../guide/development.md)