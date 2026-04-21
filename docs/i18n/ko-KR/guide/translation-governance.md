---
source_branch: master
last_sync: 2026-04-21
translation_tier: summary-sync
---

# 번역 거버넌스와 기여 절차

::: warning 번역 안내
이 페이지는 [중국어 원문](../../../guide/translation-governance.md)을 기준으로 정리했습니다. 차이가 있을 경우 원문을 우선합니다.
:::

이 문서는 모메이의 다국어 UI와 문서 번역을 어떻게 관리할지 정의합니다. 목적은 UI만 번역되고 이메일, SEO, 문서, 회귀 검증이 빠진 채 언어가 공개되는 일을 막는 것입니다.

## 1. 적용 범위

- 앱 UI locale 파일
- 이메일 locale 문구
- 문서 사이트 공개 페이지
- 문서 저장소 경로와 공개 URL 매핑
- 언어 공개와 관련된 SEO, sitemap, fallback 규칙

## 2. 언어 readiness 단계

- `draft`: 로컬 검증 전용
- `ui-ready`: 핵심 UI, 진입점, fallback 체인, 기본 품질 검사 완료
- `seo-ready`: 이메일, SEO, sitemap, 회귀 검사까지 완료

## 3. 필수 게이트

1. 고빈도 모듈 key parity
2. PrimeVue locale, Locale Registry, 언어 전환, 날짜 / 숫자 포맷 검증
3. 독립 이메일 locale 등록
4. locale route, canonical, `hreflang`, sitemap 정합성
5. 문서 사이트 홈, 빠른 시작, 번역 거버넌스 페이지 제공

## 3.1 문서 freshness tier

문서 번역은 더 이상 하나의 30일 규칙으로 처리하지 않고, 아래 tier로 나누어 관리합니다.

| tier | freshness | 허용되는 형태 |
| :--- | :--- | :--- |
| `must-sync` | 30일 | 중국어 원문과 운영상 동등해야 하는 공개 진입 페이지 |
| `summary-sync` | 45일 | 더 짧을 수 있지만 최신 규칙을 반영해야 하는 유지 요약 페이지 |
| `source-only` | 일수 기반 SLA 없음 | locale URL과 중국어 원문 진입점만 남기고 본문 유지 약속은 하지 않는 페이지 |

현재 `ko-KR`가 공개적으로 유지하는 핵심 범위는 홈, 빠른 시작, 배포 가이드, 번역 거버넌스, 기능 소개, 변수 및 설정 매핑, 로드맵 요약입니다. 깊은 guide / standards / design 페이지는 `source-only`로 내려갔습니다.

## 4. 용어 규칙

- `OpenAI`, `Cloudflare R2`, `VAPID` 같은 고유 명사는 필요 시 원문을 유지합니다.
- 같은 용어는 같은 언어 안에서 항상 같은 번역을 사용합니다.
- 한국어 UI에는 영어 자리표시자를 남기지 않습니다.

## 5. 기여 절차

1. 목표 언어와 목표 단계(`ui-ready` 또는 `seo-ready`)를 정합니다.
2. 홈, 인증, 설정, 법률 페이지, 핵심 관리자 흐름을 우선 번역합니다.
3. 번역 문서의 물리 경로는 `docs/i18n/<locale>/` 아래에 두고, 공개 문서 URL은 계속 `/<locale>/...` 형태를 유지합니다.
4. 디렉터리 마이그레이션은 이미 완료되었으므로 `docs/<locale>/`를 다시 남기거나 만들지 않습니다. 남은 번역 페이지를 발견하면 같은 변경에서 `docs/i18n/<locale>/`로 옮기고 rewrites / editLink 매핑도 함께 맞춥니다.
5. 아직 번역하지 못한 페이지는 원문 안내를 남기고 비워두지 않습니다.
6. 페이지를 `source-only`로 내릴 때는 `translation_tier: source-only`, `source_origin`, 그리고 중국어 사실원을 우선하라는 가시적 안내를 함께 추가해야 합니다.
6. 병합 전에 최소한 다음 검증을 실행합니다.

```bash
pnpm docs:check:source-of-truth
pnpm docs:check:i18n
pnpm lint
pnpm lint:i18n
pnpm i18n:audit:missing
pnpm typecheck
```

## 5.1 문서 blocker 게이트

| 상황 | 최소 명령 | blocker 규칙 |
| :--- | :--- | :--- |
| 문서 번역 변경 | `pnpm docs:check:source-of-truth` + `pnpm docs:check:i18n` | tier 선언, freshness, source 매핑이 어긋나면 blocker |
| locale 메시지 / runtime loading 변경 | 위 명령 + `pnpm lint:i18n` + `pnpm i18n:audit:missing` | 누락 key와 runtime loading 회귀는 blocker |
| 릴리스 / 단계 마감 | `pnpm regression:pre-release` 또는 `pnpm regression:phase-close` | 고정 회귀 진입점을 임시 명령 묶음으로 대체하지 않음 |

## 6. 회귀 체크리스트

1. 언어 전환 진입점이 올바르게 노출되고 locale 전환이 정상 동작하는지 확인합니다.
2. 공용 페이지와 핵심 관리자 페이지에 번역되지 않은 자리표시자가 남아 있지 않은지 확인합니다.
3. 이메일 locale이 독립 등록되어 있고 다른 언어 객체를 재사용하지 않는지 확인합니다.
4. i18n audit이 통과하고 누락 key가 없는지 확인합니다.
5. 문서 사이트의 해당 언어 홈과 빠른 시작 페이지가 정상 접근되는지 확인합니다.
6. `source-only`로 내려간 페이지가 locale navigation을 점유하지 않으면서도 중국어 원문 링크를 유지하는지 확인합니다.
