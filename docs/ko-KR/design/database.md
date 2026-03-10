---
source_branch: master
last_sync: 2026-03-10
---

# 데이터베이스 설계

::: warning 번역 안내
이 페이지는 [중국어 원문](../../design/database.md)을 기준으로 정리했습니다. 차이가 있을 경우 원문을 우선합니다.
:::

이 문서는 모메이의 데이터 계층을 상위 수준에서 설명합니다. 주요 관심사는 핵심 엔티티, 관계, 인덱스 전략, 다국어 콘텐츠 모델링입니다.

## 1. 주요 엔티티

- 사용자 계열: `User`, `Account`, `Session`, `Verification`, `ApiKey`
- 콘텐츠 계열: `Post`, `PostVersion`, `Category`, `Tag`, `Comment`
- 운영 / 구독 계열: `Subscriber`, `MarketingCampaign`, `AITask`, `Setting`, `ThemeConfig`

## 2. 다국어 모델링

- 콘텐츠는 `translationId`로 같은 의미 묶음을 형성합니다.
- `slug`와 `language`를 함께 사용해 언어별 URL을 관리합니다.
- 특정 언어가 없을 경우 동일 `translationId` 내 다른 언어로 fallback할 수 있습니다.

## 3. 인덱스 전략

- 사용자 이메일과 사용자명
- 세션 토큰
- 게시글 / 분류 / 태그의 `(slug, language)`
- 댓글의 게시글 / 부모 댓글 관계
- 구독자 이메일

## 4. 유지보수 원칙

- 스키마 변경 전 API, 프론트엔드, 마이그레이션 흐름까지 함께 검토해야 합니다.
- 다국어, 권한, 알림 매트릭스에 걸친 변경은 관련 설계 문서와 테스트를 동반해야 합니다.