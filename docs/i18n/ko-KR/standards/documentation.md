---
source_branch: master
last_sync: 2026-03-19
translation_tier: source-only
source_origin: ../../../standards/documentation.md
---

# 문서 표준

::: warning 번역 안내
이 페이지는 [중국어 원문](../../../standards/documentation.md)을 기준으로 합니다. 차이가 있으면 원문을 우선합니다.
:::

::: info 중국어 사실원 우선
이 페이지는 locale URL과 원문 진입점만 유지하는 source-only 범위입니다. 최신 내용은 [중국어 원문](../../../standards/documentation.md)을 확인하세요.
:::

이 문서는 모메이 문서의 작성, 구조화, 번역, 유지보수 규칙을 정의하며 사람과 AI 에이전트가 같은 문서 계약을 공유하도록 돕습니다.

## 1. 문서 구조

- `docs/guide/`: 시작, 배포, 개발, AI 협업 안내
- `docs/standards/`: 개발, 테스트, 보안, 계획, 문서 표준
- `docs/design/`: UI, API, 데이터베이스와 모듈 설계
- `docs/plan/`: 로드맵, todo, backlog, 아카이브
- `docs/i18n/<locale>/`: 번역 문서의 실제 저장 경로

추가 규칙:

- 공개 문서 사이트 URL은 계속 `/<locale>/...` 형식을 유지하며 `i18n/` 경로를 노출하지 않습니다.
- 마이그레이션이 완료된 뒤에는 기존 `docs/<locale>/` 디렉터리를 다시 두거나 재생성하지 않습니다. 번역 문서의 생성과 수정은 `docs/i18n/<locale>/`에서만 수행합니다.

## 2. 작성 규칙

- 문서마다 H1은 하나만 사용합니다.
- 제목 계층은 순차적으로 사용합니다.
- 내부 문서 링크는 상대 경로를 사용합니다.
- 복잡한 구조는 표, 목록, Mermaid로 표현하는 것을 우선합니다.

## 3. 번역 페이지 규칙

- `source_branch`, `last_sync`를 포함해야 합니다.
- 상단에 중국어 원문 우선 안내를 유지해야 합니다.
- 번역 문서는 `docs/i18n/<locale>/` 아래에서 원문과 같은 파일명과 구조를 최대한 유지합니다.
- `docs/<locale>/` 아래에서 남은 번역 페이지를 발견하면 같은 변경에서 `docs/i18n/<locale>/`로 옮기고 기존 복제본을 제거해야 합니다. 기존 locale 디렉터리는 다시 만들지 않습니다.

## 4. 유지보수 원칙

- 새 페이지를 추가하면 문서 사이트 nav/sidebar 설정을 함께 갱신합니다.
- 디렉터리 마이그레이션 시에는 URL 호환성과 실제 소스 파일을 가리키는 편집 링크를 동시에 보장해야 합니다.
- 명시적 요청 없이는 `CHANGELOG.md`를 수정하지 않습니다.
