---
source_branch: master
last_sync: 2026-03-10
---

# 테스트 표준

::: warning 번역 안내
이 페이지는 [중국어 원문](../../standards/testing.md)과 [영문판](../../en-US/standards/testing.md)을 바탕으로 정리했습니다. 차이가 있을 경우 중국어 원문을 우선합니다.
:::

## 1. 목표

테스트는 단위, 통합, 핵심 회귀 경로를 함께 덮어야 하며, 변경이 실행 가능할 뿐 아니라 안정적으로 배포 가능한 상태임을 보여줘야 합니다.

## 2. 자주 쓰는 검증

- `pnpm lint`
- `pnpm typecheck`
- 대상 Vitest 테스트
- i18n parity 및 문서 사이트 빌드

## 3. 다국어 변경 보강

- locale 변경 후 i18n audit를 실행합니다.
- 중요한 언어 확장에는 이메일, 설정 페이지, 문서 사이트 입구 점검이 포함됩니다.
