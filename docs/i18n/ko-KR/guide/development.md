---
source_branch: master
last_sync: 2026-03-18
---

# 개발 가이드

::: warning 번역 안내
이 페이지는 [중국어 원문](../../../guide/development.md)을 기준으로 정리했습니다. 차이가 있을 경우 원문을 우선합니다.
:::

이 문서는 모메이 로컬 개발 환경을 구성하고, 기능 개발과 문서 동기화, 품질 검증까지 일관되게 진행하기 위한 기본 흐름을 설명합니다.

## 1. 준비 사항

- Node.js `>= 20`
- PNPM 최신 안정판
- Git

## 2. 로컬 실행 흐름

```bash
git clone https://github.com/CaoMeiYouRen/momei.git
cd momei
pnpm install
pnpm dev
```

로컬 개발에서는 SQLite와 개발용 Secret이 자동으로 준비되므로 최소 설정으로 시작할 수 있습니다.

## 3. 환경 변수 설정

필요 시 다음 템플릿에서 시작할 수 있습니다.

```bash
cp .env.example .env
# 또는 전체 예시 사용
cp .env.full.example .env
```

AI, 스토리지, Memos, 설정 센터 관련 기능을 시험하려면 실제 환경 변수 값을 채워 넣는 것이 좋습니다.

## 4. 개발 시 기본 원칙

- 기존 Nuxt / TypeScript / SCSS / i18n 구조를 우선 재사용합니다.
- 기능 변경 후에는 테스트, 문서, todo 상태를 함께 갱신합니다.
- 다국어 작업 시 locale parity, 이메일 locale, 문서 사이트 진입 페이지를 함께 확인합니다.

## 5. 자주 쓰는 명령

| 명령 | 설명 |
| :--- | :--- |
| `pnpm dev` | 개발 서버 실행 |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm lint` | 코드 검사 |
| `pnpm lint:css` | 스타일 검사 |
| `pnpm test` | 단위 테스트 |
| `pnpm test:e2e` | Playwright E2E 테스트 |
| `pnpm typecheck` | 타입 검사 |
| `pnpm deploy:wrangler` | wrangler 측 적응 디버깅용이며, 전체 Cloudflare 배포 지원을 뜻하지 않음 |

## 6. 기여 흐름

1. 프로젝트를 fork 합니다.
2. 기능 브랜치를 만듭니다.
3. 코드, 문서, 테스트를 함께 갱신합니다.
4. lint / typecheck / 관련 테스트를 통과시킵니다.
5. PR 설명에 검증 결과와 변경 범위를 정리합니다.
