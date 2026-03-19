---
source_branch: master
last_sync: 2026-03-19
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
6. 병합 전에 최소한 다음 검증을 실행합니다.

```bash
node scripts/i18n/audit-locale-keys.mjs --fail-on-missing
pnpm docs:check:i18n
pnpm lint
pnpm typecheck
```
