---
source_branch: master
last_sync: 2026-03-10
---

# API 표준

::: warning 번역 안내
이 페이지는 [중국어 원문](../../standards/api.md)을 기준으로 정리했습니다. 차이가 있을 경우 원문을 우선합니다.
:::

이 문서는 모메이 백엔드 API의 공통 규칙을 정의합니다. 응답 형식, 인증 방식, 입력 검증, 장시간 작업 처리 방식이 모두 이 문서를 기준으로 정렬되어야 합니다.

## 1. HTTP 메서드

- `GET`: 조회
- `POST`: 생성
- `PUT`: 전체 또는 부분 업데이트
- `DELETE`: 삭제

프로젝트에서는 `PATCH`를 사용하지 않고 부분 업데이트도 `PUT`으로 처리합니다.

## 2. 공통 응답 형식

스트리밍이나 파일 다운로드가 아닌 경우, 응답은 다음과 같은 구조를 따릅니다.

```typescript
interface ApiResponse<T = unknown> {
    code: number;
    message: string;
    data?: T;
    locale?: string;
}
```

주요 상태 코드는 `200`, `400`, `401`, `403`을 기본으로 사용합니다.

## 3. 인증과 권한

- better-auth를 사용합니다.
- SSR을 고려해 Cookie 기반 Session을 사용합니다.
- 권한 확인은 `requireAuth`, `requireAdmin` 같은 공통 도구를 우선 사용합니다.

## 4. 입력 검증

- Query, Body, Params는 모두 Zod schema로 검증합니다.
- 앞뒤에서 모두 쓰는 schema는 공유 디렉터리에 두어 중복을 줄입니다.

## 5. 이메일과 작업 API

- 이메일 문구는 독립 locale로 관리합니다.
- `/api/tasks/*` 같은 작업 엔드포인트는 반드시 인증이 필요합니다.
- 오래 걸리는 작업은 비동기 작업 시스템으로 설계하고 task id를 반환해야 합니다.
- 작업 로그와 실패 상태 추적을 남겨야 합니다.