---
source_branch: master
last_sync: 2026-03-10
---

# 개발 표준

::: warning 번역 안내
이 페이지는 [중국어 원문](../../../standards/development.md)을 기준으로 정리했습니다. 차이가 있을 경우 원문을 우선합니다.
:::

이 문서는 모메이 프로젝트의 핵심 개발 원칙, 디렉터리 경계, 코드 스타일, 제출 흐름을 정의합니다.

## 1. 핵심 원칙

- 모듈성과 재사용성을 우선합니다.
- TypeScript 타입 안전성을 유지합니다.
- 변경 범위는 최소화하고 원인 해결에 집중합니다.
- 과도한 설계보다 실제 유지보수성과 ROI를 우선합니다.

## 2. 코드 스타일

- 파일명은 `kebab-case`
- 타입과 schema는 `PascalCase`
- 흐름 제어는 Early Return 우선
- UI 문자열은 i18n을 통해 관리
- 스타일은 SCSS + BEM 기반

## 3. 디렉터리와 의존성 경계

- `components/`, `pages/`, `composables/`, `utils/`, `server/`, `docs/`의 책임을 분리합니다.
- `shared`는 `web`이나 `server`를 참조하지 않습니다.
- 공통 로직은 가능하면 `shared` 또는 재사용 가능한 composable로 추출합니다.

## 4. 구현과 제출

- 새 코드는 TypeScript 기준으로 작성합니다.
- Vue는 `<script setup lang="ts">`를 사용합니다.
- 제출 전 lint, typecheck, 관련 테스트를 통과해야 합니다.
- Conventional Commits를 따르고, 한 커밋에는 하나의 기능 축만 담는 것이 좋습니다.

## 5. 문서 동기화

핵심 기능, 설정, 아키텍처가 바뀌면 설계 문서와 README, 가이드를 함께 검토해야 합니다.