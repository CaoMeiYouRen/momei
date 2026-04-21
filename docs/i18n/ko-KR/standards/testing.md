---
source_branch: master
last_sync: 2026-03-10
translation_tier: source-only
source_origin: ../../../standards/testing.md
---

# 테스트 표준

::: warning 번역 안내
이 페이지는 [중국어 원문](../../../standards/testing.md)을 기준으로 정리했습니다. 차이가 있을 경우 원문을 우선합니다.
:::

::: info 중국어 사실원 우선
이 페이지는 locale URL과 원문 진입점만 유지하는 source-only 범위입니다. 최신 내용은 [중국어 원문](../../../standards/testing.md)을 확인하세요.
:::

이 문서는 모메이의 테스트 계층, 파일 배치 규칙, 커버리지 기대치, 효율적인 실행 전략을 설명합니다.

## 1. 도구 체계

- Vitest: 단위 / 통합 테스트
- Playwright: E2E 테스트
- `pnpm test`: 공통 테스트 진입점

## 2. 파일 구조

- 소스와 밀접한 단위 테스트는 보통 원본 파일 옆에 둡니다.
- API / 서버 통합 테스트는 `tests/server/`에 둡니다.
- E2E는 `tests/e2e/`에 둡니다.

## 3. 테스트 범위

- 컴포넌트: props, 이벤트, 상태 변화
- 페이지: 라우트 파라미터, 렌더링, SEO meta
- API: 입력 검증, 성공 / 실패 응답, 권한 흐름
- 외부 서비스는 적절히 mock 처리합니다.

## 4. 실행 전략

- 일상 개발에서는 관련 테스트만 우선 실행합니다.
- 대규모 리팩터링, 보안 민감 변경, 핵심 경로 변경 시 전체 테스트를 고려합니다.
- 다국어 변경 후에는 i18n audit와 문서 빌드도 함께 확인하는 것이 좋습니다.

## 5. 제출 전 권장 검증

```bash
pnpm lint
pnpm typecheck
pnpm test
```
