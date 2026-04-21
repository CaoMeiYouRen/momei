---
source_branch: master
last_sync: 2026-03-10
translation_tier: source-only
source_origin: ../../../standards/planning.md
---

# 계획 및 평가 표준

::: warning 번역 안내
이 페이지는 [중국어 원문](../../../standards/planning.md)을 기준으로 정리했습니다. 차이가 있을 경우 원문을 우선합니다.
:::

::: info 중국어 사실원 우선
이 페이지는 locale URL과 원문 진입점만 유지하는 source-only 범위입니다. 최신 내용은 [중국어 원문](../../../standards/planning.md)을 확인하세요.
:::

이 문서는 단계 계획, 요구사항 진입 조건, todo 유지 방식을 정의합니다. 목표는 기능 범위가 무제한으로 퍼지는 것을 막고, 팀 에너지를 핵심 가치에 집중시키는 것입니다.

## 1. 계획 제약

- 한 단계의 핵심 작업 수는 관리 가능한 수준으로 제한합니다.
- 새 기능이 기존 핵심 기능을 무너뜨려서는 안 됩니다.
- 계획 단계에서 테스트 전략과 인수 기준을 함께 생각해야 합니다.
- 요구가 모호하면 먼저 질문하고, 바로 구현하지 않습니다.

## 2. 평가 방식

기능은 Value, Alignment, Difficulty, Risk 네 가지 축으로 평가합니다.

$$Score = \frac{Value + Alignment}{Difficulty + Risk}$$

이 점수는 현재 단계 진입 여부나 backlog 편입 여부를 판단하는 기준이 됩니다.

## 3. 로드맵과 todo

- `roadmap.md`: 중장기 방향
- `todo.md`: 현재 단계의 실행 항목
- `todo-archive.md`: 완료된 단계의 기록

새 요구는 먼저 roadmap에 넣고, 실제로 시작할 때 todo로 분해하는 것이 원칙입니다.

## 4. 되돌리지 않는 원칙

완료 처리된 단계는 다시 정의하거나 삭제하지 않습니다. 부족한 부분이 발견되면 새 보강 작업으로 처리합니다.

## 5. 단계 종료와 아카이브

- 핵심 작업이 모두 끝나면 해당 단계는 아카이브됩니다.
- `todo.md`는 현재 작업만 남기고 간결하게 유지합니다.
