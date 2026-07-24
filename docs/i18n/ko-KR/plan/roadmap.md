---
source_branch: master
last_sync: 2026-07-24
---

# Momei 프로젝트 로드맵

::: warning 번역 안내
이 페이지는 [중국어 원문](../../../plan/roadmap.md)을 기준으로 정리했습니다. 계획 문서는 자주 변경되므로 차이가 있을 경우 원문을 우선합니다.
:::

이 문서는 모메이의 중장기 방향을 요약합니다. 현재 단계의 실제 작업 항목은 [todo](../../../plan/todo.md)와 [todo archive](../../../plan/todo-archive.md)를 함께 보아야 하며, 장기 backlog 는 중국어 [backlog 문서](../../../plan/backlog.md)에서 별도로 관리합니다.

## 1. 프로젝트 개요

- 목표: **AI 기반, 네이티브 국제화 개발자 블로그 플랫폼** 구축
- 핵심 가치: 다국어 콘텐츠 운영, AI 보조 창작, 현대적 프론트엔드 / 백엔드 구조, 마이그레이션 친화성
- 대상 사용자: 개발자, 기술 작성자, 글로벌 독자층을 겨냥한 창작자

## 2. 완료된 단계 요약

- 초기 MVP, 콘텐츠 관리, 기본 i18n, 관리자 기능 확보
- AI 요약 / 제목 / 번역, SEO, 구독 체계 강화
- 주제 시스템, 렌더링 강화, 설치 마법사, CLI 마이그레이션, TTS / ASR, 설정 / 스토리지 정합성 보강

## 3. 최신 진행 상황과 다음 단계

- **16-17단계는 감사 후 보관 완료**: 표준 사실원 정리, Review Gate 증적 고도화, skills / agents 미러 거버넌스, 설정 사실원 재사용, 인증 세션 거버넌스, 관리자 메일 템플릿, Serverless 장문 번역 이어달리기, AI 시각 자산 정리, 기존 자산 링크 마이그레이션 도구까지 모두 정리되었습니다.
- **17단계 마감 보강**: release 의존성 위험 게이트와 관리자 새 글의 빈 초안 언어 전환 회귀도 같은 단계의 마감 수정으로 처리되었고, 회귀 로그에 증거가 남아 있습니다.
- **18단계는 감사 완료 후 아카이브되었습니다**: 다중 엔진 브라우저 검증, 성능 예산 기준선, `html-minifier` 고위험 의존성 체인 대체, 관리자 admin locale 대형 파일 분리, `ja-JP`의 `seo-ready` 승격, WechatSync 웨이보 호환 / 사전 점검·미리보기와 번역 워크플로의 태그 진행률 수렴까지 마무리되었습니다.
- **이번 단계에 올리지 않은 거버넌스 항목은 backlog 로 되돌렸습니다**: 반복 순수 함수 / 공용 타입 조각 정리는 단계 용량 제약으로 실행 단계에 편입하지 않았으며, 이후에는 중국어 [backlog 문서](../../../plan/backlog.md)를 기준으로 다시 평가합니다.
- **19단계는 감사 완료 후 아카이브되었습니다**: Skills 가시성 계층화, 회귀 로그 색인 및 비교 경로, 반복 순수 함수 / 공용 타입의 1차 재사용 수렴, PostgreSQL 트래픽 핫스팟 관측과 최소 범위 개선까지 모두 마감되었습니다. serverless 직쓰기 fallback 은 후속 운영 관찰 항목으로만 남겨 두었습니다.
- **20단계도 감사 완료 후 아카이브되었습니다**: 브라우저 / E2E 안정화, Release 와 Review Gate 자동화 통합, 보안 알림 폐쇄, 중복 코드 검출 기준선이 스크립트와 회귀 증적까지 포함해 모두 수렴되었습니다. 중복 코드의 1차 “다음 처리 후보”는 후속 거버넌스 과제로 유지되며 더 이상 20단계의 차단 요인이 아닙니다.
- **21단계는 감사 완료 후 아카이브되었습니다**: UI 실제 환경 테스트 흐름 거버넌스, 스크립트 실행 진입점 정리, 태그 번역 선행화, 기본 커버 문안 압축과 대형 타이포 전략이 중국어 사실원에서 모두 수렴되었습니다.
- **22단계는 감사 완료 후 아카이브되었습니다**: 테스트 유효성 강화, 주기적 회귀 작업의 실운영화, 게시물 일괄 번역 오케스트레이션 평가, ESLint 규칙의 단계적 강화, 시간 / 날짜 사실원 수렴, 관리자 게시물 관리 진입점 상단 바 전진 배치까지 6개 축이 중국어 사실원에서 모두 수렴되었습니다.
- **23단계는 감사 완료 후 아카이브되었습니다**: 다국어 소셜 / 스폰서 플랫폼 확장, Vercel 환경의 AI 미디어 타임아웃 보상, 의존성 위험 일일 순회 자동화, 실시간 ASR 자격 증명 유효 기간 연장, 그리고 게시물 상세의 관련 글 추천이 중국어 사실원에서 모두 수렴되었습니다.
- **24단계는 감사 완료 후 아카이브되었습니다**: 테스트 커버리지와 red-green 유효성, ESLint / 타입 부채의 단계적 강화, 중복 코드 / 순수 함수 수렴, 그리고 증적을 남기는 단계급 회귀 작업 실행이라는 4개 장기 주선은 중국어 사실원에서 첫 실행 슬라이스와 수거 증적까지 모두 마감되었습니다.
- **25단계는 감사 완료 후 아카이브되었습니다**: 배포 및 초기화 경험, 에디터와 본문 렌더링의 2차 수렴, 빌드 속도와 번들 성능 심화, Cloudflare 런타임 적합성 연구, 그리고 AI 초기화 / 설정 도우미 평가라는 5개 축이 중국어 사실원과 아카이브 문서에서 모두 수렴되었습니다.
- **26단계는 감사 완료 후 아카이브되었습니다**: 5개 주선이 코드, 회귀 기록, 운영 모니터링까지 포함해 모두 수렴되었습니다. 전역 coverage 는 단계 목표(약 `72%`)에 도달했으며, PostgreSQL 역시 쿼리 수렴 및 캐시 보강 이후 모니터링에서 쿼리 / 연결 압력이 유의미하게 완화된 것이 확인되었습니다.
- **27단계는 감사 완료 후 아카이브되었습니다**: 채널 배포 회귀 수렴, 글 공유 및 아이콘 시스템 정리, 캐시 재사용 확장, 1차 성능 기준선 작업, E2E 첫 번째 매트릭스가 모두 중국어 사실원에서 수렴되었습니다.
- **28단계는 감사 완료 후 아카이브되었습니다**: 관리자 콘텐츠 인사이트 대시보드, PostgreSQL CPU / 연결 수명 균형화, coverage `76%+` 상향, i18n 런타임 로딩 거버넌스, 에디터 Markdown / 시각 일관성 강화의 다섯 주선이 중국어 사실원, 회귀 증거, 아카이브 문서에서 모두 수렴되었습니다.
- **29단계는 감사 완료 후 아카이브되었습니다**: 댓글 번역, GEO / SEO / AI crawler 가시성 보강, ESLint / 타입 부채 단계적 수렴, 중복 코드 / 순수 함수 재사용 수렴, i18n 2차 거버넌스, 문서 / 회귀 / 심화 아카이브 거버넌스가 중국어 사실원, 회귀 증거, 아카이브 문서에서 모두 수렴되었습니다.
- **30단계는 감사 완료 후 아카이브되었습니다**: Hexo 스타일 글 저장소 동기화(GitHub / Gitee) 후보 착지가 이번 단계의 유일한 신규 기능으로 수렴되었고, 문서 번역 freshness 상환, i18n 필드 거버넌스, 중복 코드 / 순수 함수 재사용, 기존 코드 주석 거버넌스, ESLint / 타입 부채 규칙 수렴도 중국어 사실원, 회귀 증거, 아카이브 문서에서 모두 수렴되었습니다.
- **31단계는 감사 완료 후 아카이브되었습니다**: `caomei-auth` 서드파티 로그인 지원 평가와 접속 사전 검토, roadmap / todo 심화 아카이브 거버넌스, i18n 런타임 로딩 및 문구 재사용 거버넌스, `composables` 버킷 ESLint / 타입 부채 수렴, coverage `76%+` 마감, 상업화 전환 재평가까지 여섯 개 주선이 중국어 사실원, 회귀 증거, 아카이브 문서에서 모두 수렴되었습니다.
- **32단계는 감사 완료 후 아카이브되었습니다**: 다국어 콘텐츠 자산화 강화 패키지의 통합 유입 페이지, 중복 코드 / 순수 함수 재사용, 단일 규칙 ESLint / 타입 부채 슬라이스, Postgres 공개 핫리드 거버넌스, AITask stale compensation 파생 슬라이스가 중국어 사실원과 아카이브 문서에서 모두 수렴되었습니다.
- **33단계는 감사 완료 후 아카이브되었습니다**: 창작자 통계, `80%+` coverage 스프린트 재시동, `composables` ESLint fallback 슬라이스, 중복 코드 수렴, 후보군 B 기존 코드 주석 거버넌스가 중국어 사실원과 아카이브 문서에서 모두 수렴되었습니다.
- **34단계는 감사 완료 후 아카이브되었습니다**: Volcengine 중심의 프런트 직출 TTS + OSS 직전송 프로토타입, 전역 lines `80.05%` checkpoint, 실제 `pnpm regression:phase-close`, 다음 ESLint 슬라이스, i18n 런타임 확장, 문서 번역 freshness 정리가 중국어 사실원, 회귀 증거, 아카이브 문서에서 모두 수렴되었습니다.
- **35단계는 감사 완료 후 아카이브되었습니다**: AI task 계량 구간과 프런트 직출 TTS 회귀 방지(Volcengine 프런트 직결 과금 폐쇄 루프 포함), Postgres 핫 리드 체인과 DB 기동 경계 거버넌스(`pg_stat_statements` 대조 샘플링으로 메인 페이지 popular posts의 사전 settings 조회 제거 증명), 다음 ESLint / 타입 부채 슬라이스(`server/utils/post-access.ts` 3곳 `any` 수렴), 구조 재사용 거버넌스(`isRecord` / `isPlainRecord` 및 `MaybeReactive<T>` 2개 타입 수렴), 기존 코드 주석 거버넌스 후보군 A(`server/utils/locale.ts` + `server/middleware/1-auth.ts`)가 중국어 사실원, 회귀 증거, 아카이브 문서에서 모두 수렴되었습니다.
- **36단계는 감사 완료 후 아카이브되었습니다**: `initializeDB()` 동시성 창과 Redis 연결 타임아웃 거버넌스, TTS 프런트 직결 / 직전송 OSS backlog 정리, 최신 ESLint / 타입 부채 슬라이스, TTS task 및 `LocaleOption` 구조 재사용 수렴, 공개 읽기 API 주석 거버넌스 후보군 C가 중국어 사실원과 아카이브 문서에서 모두 수렴되었습니다.
- **37단계는 감사 후 아카이브가 완료되었습니다**: Windows 로컬 `nuxt dev` / `nuxt build` 성능 거버넌스, 고위험 테스트 유효성 슬라이스, 다음 ESLint / 타입 부채 협소 슬라이스, 최소 3곳의 구조 재사용 핫스팟, PostgreSQL 장기 관측 복기 슬라이스가 중국어 사실원, 회귀 증거, 아카이브 문서에서 모두 수렴되었습니다.
- **38단계는 감사 완료 후 아카이브되었습니다**: `B 站 / Memos` 태그 꼬리주석과 미리보기 일관성, 테스트 유효성 2차 슬라이스, Postgres 공개 핫리드 단일 경로의 손실 제한형 경량화와 원인 수렴, 구조 재사용 2차, 다음 ESLint / 타입 부채 협소 슬라이스가 중국어 사실원, 회귀 증거, 아카이브 문서에서 모두 수렴되었습니다.
- **39단계는 감사 완료 후 아카이브되었습니다**: 위챗 공식계정 포맷 미리보기 / 내보내기 보조와 함께 구조 재사용, 주석 거버넌스, 문서 / 스크립트 거버넌스, i18n 문안 재사용 런타임 확장의 4개 거버넌스 슬라이스가 중국어 사실원 기준으로 모두 수렴되었고, 아카이브 및 로드맵 상태가 동기화되었습니다.
- **40단계는 감사 완료 후 아카이브되었습니다**: release / test / docker 워크플로가 공통 pre-check 게이트로 수렴되었고 실행 순서도 고정되었습니다. TypeORM `1.0.0` 호환성 평가는 `NO-GO(직접 업그레이드)` 및 `GO(평가 과제 수거)` 결론으로 마감되었으며, 근거는 중국어 회귀 창과 아카이브 문서에 동기화되었습니다.
- **45단계는 감사 완료 후 아카이브되었습니다**: Umami 프라이버시 자가호스팅 분석 Phase 1, Digital Garden go/no-go 평가, 문서 거버넌스 마감, ESLint / 타입 부채 슬라이스, 구조 재사용 수렴 5개 주선이 중국어 사실원 기준으로 모두 수거되었습니다.
- **46단계는 감사 완료 후 아카이브되었습니다**: Umami 프라이버시 자가호스팅 분석 Phase 2 배포 수거, ESLint / 타입 부채 협소 슬라이스, 구조 재사용 핫스팟 수렴, 커버리지 거버넌스, 주간 회귀 수거, 데이터베이스 초기화/문서 동기화 6개 주선이 중국어 사실원에서 모두 수거되었습니다. 최신 주간 회귀 결론은 `Pass`이며 warning 은 `duplicate-code:check` 한 건입니다.
- **47~49단계는 감사 완료 후 아카이브되었습니다**: 47단계에서 ESLint/타입 부채, 구조 재사용, API 경로 정규화, 미사용 API 인벤토리, Schema 커버리지 6개 트랙을 마감. 48단계에서 ESLint 협소 슬라이스 확장, 구조 재사용 심화, API Schema 전면 커버리지(→85%), 미사용 API 안전 삭제, 2차 조사 마감. 49단계에서 Postgres 트래픽 거버넌스(네트워크 89% 소비 경고), formatDate 통합, 지연 테스트 보충, 정리 마감.
- **50단계는 감사 완료 후 아카이브되었습니다**: PWA 기능 활성화(`@vite-pwa/nuxt`, 607개 항목 사전 캐시), API 테스트 계층 수렴(4개 샘플 이전 + 거버넌스 문서), i18n 첫 화면 번역 안정성(17개 라우트 히트 매트릭스 + 3건 수정), 백로그 심층 정리(Phase 32-41 로드맵 아카이브 압축 772→409행), 블로그링 네비게이션 평가(Go 결론, 약 4h 작업량).
- **52단계는 감사 완료 후 아카이브되었습니다**: 스크립트 거버넌스 warning 정리와 승격 평가(audit-comment-drift 오탐 정리, line-count 임계값 조정, source-of-truth 동기화, audit-comment-drift→regression:weekly 승격), 문서 거버넌스 아카이브 감사와 임계값 강화 평가(5개 평가 문서 아카이브, must-sync 30→21일, summary-sync 45→30일), 모바일 CWV 성능 기준선 수집과 평가(LCP 1.6s-2.2s, 모두 2.5s 미만), i18n 런타임 검증 확장(홈페이지 + 기사 상세 페이지 추가), 테스트 유효성 2차 슬라이스(9개 실패 경로 어서션, 4개 모듈 커버).
- **53단계는 감사 완료 후 아카이브되었습니다**: Vercel CDN 캐시 Tier 2 아키텍처 거버넌스(routeRules ISR/SWR + Upstash Redis), 문서 거버넌스 임계값 강화(must-sync 21일, summary-sync 30일), ESLint/타입 부채 제로화(마지막 3곳 as any), 구조 재사용 5개 핫스팟 슬라이스(duplicate-code 0.39%→0.24%), AI 편집 강화 평가(조건부 Go).
- **54단계는 감사 완료 후 아카이브되었습니다**: CLI/MCP API 클라이언트 재사용 최적화 1단계(CLI +3, MCP +4), 구조 재사용 심층 영역(단일 함수 파일 통합 + 로직 중복 검출 스크립트), ESLint/타입 부채 거버넌스(규칙 부채 inventory 스크립트 + 3개 협소 슬라이스), 테스트 유효성 2차 슬라이스(6개 새 어서션, 3개 모듈), 스크립트 거버넌스(eslint-debt를 regression:weekly로 승격).
- **55단계는 감사 완료 후 아카이브되었습니다**: CLI/MCP 2단계 외부 인터페이스 확장(4개 REST + 인사이트를 글로 변환 + 글 버전, CLI +15, MCP +16), AI 폴백 대체 경로(폴백 체인 + 투명 전환), 구조 재사용 로직 중복 수렴(2개 추상 슬라이스, duplicate-code 0.33% < 기준선 1.22%), ESLint/타입 부채 3개 협소 슬라이스(22곳 제거), 테스트 유효성 3차 슬라이스(7개 새 어서션, 3개 모듈).
- **56단계는 감사 완료 후 아카이브되었습니다**: 공유 API 클라이언트 라이브러리 추출(`packages/api-client` + `MomeiHttpClient` + 7개 도메인 모듈 + 29개 테스트, CLI/MCP axios 제거), CLI 내보내기 명령어(`momei export` + Hexo 호환 Front-matter + 필터 파라미터 + JSON 출력), ESLint/타입 부채 3개 협소 슬라이스(`submission.ts`, `settings.vue`, `commercial-link-manager.vue` no-explicit-any 제거), 구조 재사용 2개 핫스팟 슬라이스(`prepareSplitContent` + `parseTranslateBody` 공유 함수, duplicate-code 0.30%), 테스트 유효성 4차 슬라이스(6개 새 오류 경로 어서션, translate + tts-task-get 2개 모듈).
- **57단계는 감사 완료 후 아카이브되었습니다**: 마이그레이션 경험 향상(로컬 이미지 자동 업로드, `updatedAt` 메타데이터 확장), 테스트 유효성 5차 슬라이스(13+ 실패 경로 어서션, 4개 모듈 커버), ESLint/타입 부채 3개 협소 슬라이스(validate-api-key, translation, types/ai). 구조 재사용은 58단계로 연기.
- **58단계는 감사 완료 후 아카이브되었습니다**: MCP HTTP 전송 및 마운트(`server/plugins/mcp-http.ts` + `server/api/mcp/index.ts`), RSS 피드 미화(`feed-style.css` + `injectRssStylesheet`), 구조 재사용 2개 api-client 타입 수렴 슬라이스(duplicate-code 0.31%), ESLint/타입 부채 거버넌스 사이클 종료(NO_EXPLICIT_ANY_FILES 전부 제로), 테스트 유효성 6차 슬라이스(12개 실패 경로 어서션, 3개 모듈 커버).
- **59단계는 감사 완료 후 아카이브되었습니다**: AI 편집 강화(rewrite + review, 6가지 스타일 + 캐싱), 최근 인기 글 목록(`post_view_hourly` 집계 + `/api/posts/home` 통합), Demo Banner 다크모드 수정(투명도 실색 처리), E2E CI 속도 제한 수정 + GHA 샤딩(공유 build job + 4행렬 샤딩, 코드 `b6b567a7`에 제출), 테스트 커버리지 90%+ 1차(갭 분석 리포트 + 2회 8개 파일, ~252행 +1.09%).
- **60단계는 감사 완료 후 아카이브되었습니다**: AI 편집 계속 쓰기(Continue)(`server/api/ai/continue.post.ts` + 에디터 도구 모음 버튼 + Ctrl+Z 실행 취소 + AI 과금 continue 유형), reactive→ref Step 1 마이그레이션(5개 파일: 로그인/등록/혜택/프로필 설정/보안 설정), Zod Schema 재사용 Ad Campaign + Ad Placement(`utils/schemas/ad.ts` 공유 베이스 + `.partial()` 파생), 테스트 커버리지 90%+ 2차(69개 새 테스트, 3개 AI Provider 모듈 대상), Hugo 형식 멀티플랫폼 마이그레이션 어댑터(`ContentParser` 인터페이스 + `HugoParser` TOML/YAML/JSON + `--format hugo` CLI 플래그 + 17개 유닛 테스트). 모든 주선이 Code Auditor 심사를 통과.
- **61단계는 감사 완료 후 아카이브되었습니다**: AI 편집 확장(Expand) + 축약(Condense) 기능(`/api/ai/expand` + `/api/ai/condense` 엔드포인트, 에디터 도구 모음 버튼, `AI_PROMPTS.EXPAND` + `CONDENSE` 템플릿, AI 과금 expand/condense 유형), 구조 재사용 거버넌스(CLI 패키지 타입 수렴: enum 파생 + `@deprecated` 타입 별칭, `toDateOrNull`/`toDateOrUndefined` 추출), reactive→ref Step 2 마이그레이션(관리자 목록 페이지 9곳 reactive 객체 마이그레이션), 테스트 커버리지 90%+ 3차(4개 고가치 모듈: installation.ts 86.84%, comment.ts 86.82%, admin-drafts.ts 92.45%, post-automation-helpers.ts 전체 커버리지), Zod Schema 재사용 거버넌스 2차(Category/Tag 중복 `.extend({slug})` 제거, Post 4개 필드 공유, Marketing Campaign updateSchema). 모든 주선이 Code Auditor 심사를 통과.
- **62단계는 감사 완료 후 아카이브되었습니다**: 멀티플랫폼 마이그레이션 어댑터 WordPress Parser(`602326cb`, WXR 파싱 + `--format wordpress` CLI 플래그 + 17개 테스트, Hexo/Hugo 회귀 없음), 테스트 커버리지 90%+ 4차(`98d5268c`, 26개 테스트로 4개 유틸리티 함수 100% 커버), AI 편집자/독자 관점 체크(`f48f39b3`, `/api/ai/perspective-check` 엔드포인트 `mode: 'editor' | 'reader'` 지원 + 에디터 도구 모음 버튼 + `PostEditorPerspectivePanel` + AI 과금), reactive→ref Step 3 마이그레이션(`405825cb`, 3개 파일 18곳 깊은 중첩 reactive 대체: settings-notifications/comments/submissions + 11개 테스트 통과), 스크립트 거버넌스 warning 정리(`ab87cd32`, audit-comment-drift TODO 제로 + 재진술 오탐 15→6 -60% + docs candidate warning 클린). 모든 주선이 lint/typecheck/test/docs:build 품질 게이트 통과(4198개 테스트 통과).
- **요약 범위 안내**: 이 페이지는 최근 감사가 완료된 단계의 요약을 함께 제공합니다. 상세 수용 기준과 작업 분해는 중국어 원문 `roadmap.md` 및 `todo.md`를 기준으로 합니다.

## 4. 장기 backlog

> [!NOTE]
> 장기 backlog 는 이제 중국어 [backlog 문서](../../../plan/backlog.md)에서 별도로 유지됩니다. 실제 우선순위와 상향된 항목은 해당 문서와 [중국어 원문 로드맵](../../../plan/roadmap.md)을 함께 확인해 주세요.

## 5. 함께 읽기

- [계획 표준](../standards/planning.md)
- [번역 거버넌스](../guide/translation-governance.md)
- 최신 상세 정보는 [중국어 원문 로드맵](../../../plan/roadmap.md)
