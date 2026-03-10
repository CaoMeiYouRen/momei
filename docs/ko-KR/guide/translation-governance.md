---
source_branch: master
last_sync: 2026-03-10
---

# 번역 거버넌스와 기여 절차

::: warning 번역 안내
이 문서는 [중국어 원문](../../guide/translation-governance.md)을 번역한 것입니다. 차이가 있을 경우 원문을 우선합니다.
:::

## 1. 목표와 범위

이 문서는 모메이의 다국어 UI와 문서를 관리하는 기준을 정의합니다. 목표는 UI만 번역되고 이메일, SEO, 회귀 점검이 빠진 반쪽짜리 언어 릴리스를 막는 것입니다.

범위는 다음과 같습니다.

- 앱 UI locale 파일
- 이메일 locale 문안
- 문서 사이트 공개 페이지
- SEO, 사이트맵, fallback 규칙

## 2. 릴리스 단계

- `draft`: 로컬 검증 전용이며 공개 언어 스위처에 노출되지 않습니다.
- `ui-ready`: 핵심 UI, 언어 진입점, fallback 체인, 기본 품질 점검이 완료된 상태입니다.
- `seo-ready`: `ui-ready` 위에 이메일, SEO, 사이트맵, 회귀 점검까지 완료된 상태입니다.

## 3. 필수 점검 항목

1. 고빈도 모듈 parity
2. PrimeVue, Locale Registry, 언어 스위처, 날짜/숫자 포맷 적용 여부
3. 독립 이메일 locale 등록 여부
4. locale routing, canonical, hreflang, sitemap 정합성
5. 문서 사이트 홈, 빠른 시작, 번역 거버넌스 페이지 제공 여부

## 4. 기여 절차

1. 대상 언어와 목표 단계(`ui-ready` 또는 `seo-ready`)를 먼저 정합니다.
2. 고빈도 화면과 핵심 관리자 흐름을 먼저 번역합니다.
3. 아직 번역하지 않은 모듈은 원문으로 연결하고 빈 자리표시자는 남기지 않습니다.
4. 병합 전 최소한 다음 검사를 실행합니다.

```bash
node scripts/i18n/audit-locale-keys.mjs --fail-on-missing
pnpm lint
pnpm typecheck
```

## 5. 용어 규칙

- `OpenAI`, `Cloudflare R2`, `VAPID` 같은 고유명은 필요 시 원문을 유지합니다.
- 한국어 UI에는 영어 자리표시자를 남기지 않습니다.
- 같은 용어는 같은 언어 안에서 항상 같은 번역을 사용합니다.
