<h1 align="center">
  <img src="./public/logo.png" alt="모메이 블로그" width="128" />
  <br />
  모메이 블로그
</h1>
<p align="center">
  <img alt="Version" src="https://img.shields.io/github/package-json/v/CaoMeiYouRen/momei.svg" />
  <a href="https://hub.docker.com/r/caomeiyouren/momei" target="_blank">
    <img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/caomeiyouren/momei">
  </a>
  <a href="https://app.codecov.io/gh/CaoMeiYouRen/momei" target="_blank">
    <img alt="Codecov" src="https://img.shields.io/codecov/c/github/CaoMeiYouRen/momei">
  </a>
  <a href="https://github.com/CaoMeiYouRen/momei/actions?query=workflow%3ARelease" target="_blank">
    <img alt="GitHub Workflow Status" src="https://img.shields.io/github/actions/workflow/status/CaoMeiYouRen/momei/release.yml?branch=master">
  </a>
  <img src="https://img.shields.io/badge/node-%3E%3D20-blue.svg" />
  <a href="https://docs.momei.app/ko-KR/" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/CaoMeiYouRen/momei/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/CaoMeiYouRen/momei/blob/master/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/github/license/CaoMeiYouRen/momei?color=yellow" />
  </a>
  <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank">
    <img alt="License: CC BY-NC-SA 4.0" src="https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg" />
  </a>
</p>

<p align="center">
  <a href="./README.md">简体中文</a> |
  <a href="./README.zh-TW.md">繁體中文</a> |
  <a href="./README.en-US.md">English</a> |
  <a href="./README.ko-KR.md">한국어</a> |
  <a href="./README.ja-JP.md">日本語</a>
</p>

<p align="center">
  <a href="https://momei.app/"><strong>🌐 메인 사이트</strong></a> &nbsp;|&nbsp;
  <a href="https://docs.momei.app/ko-KR/"><strong>📚 문서 사이트</strong></a>
</p>

> **모메이 블로그 - AI 기반 네이티브 국제화를 갖춘 개발자 블로그 플랫폼.**
>
> **AI Powered, Global Creation.**

## 📖 소개

모메이 블로그는 **Nuxt** 기반으로 구축된 현대적인 블로그 플랫폼입니다. AI와 깊이 있는 국제화 지원을 통해 기술 개발자와 글로벌 콘텐츠 창작자에게 효율적이고 지능적인 제작 경험을 제공하는 것을 목표로 합니다. 스마트 번역, 자동 요약, 다국어 라우팅 관리까지 모메이는 전 세계 독자와의 연결을 더 쉽게 만들어 줍니다.

## ✨ 핵심 기능

-   **AI 기반 작성**: AI 어시스턴트를 깊이 통합하여 완전 자동 번역, 스마트 제목, 요약 생성 등을 지원하고, 글쓰기 효율을 크게 높입니다.
-   **멀티모달 콘텐츠 워크플로**: AI 이미지 생성, ASR, 재사용 가능한 음성 입력, Memos / WechatSync 수동 배포, 예약 작업 자동화를 이미 지원하여 아이디어 수집부터 발행까지 전체 흐름을 포괄합니다.
-   **네이티브 국제화 (i18n)**: UI부터 콘텐츠 관리까지 다국어 지원이 기본 내장되어 있어 글로벌 독자에게 쉽게 도달할 수 있습니다.
-   **현대적인 기술 스택**: Nuxt (Vue 3 + TypeScript) 기반으로 구축되며, SSG / SSR 하이브리드 렌더링을 지원하고 성능이 우수합니다.
-   **부드러운 마이그레이션**: 사용자 정의 URL Slug(경로 별칭)을 지원하여 기존 블로그에서 이전할 때 SEO 손실을 최소화합니다.
-   **Markdown 작성 경험**: 실시간 미리보기와 이미지 드래그 앤 드롭 업로드를 지원하는 간결하고 효율적인 Markdown 편집기를 제공합니다.
-   **콘텐츠 편성과 브랜드 의미 체계**: 홈의 “최신 글 + 인기 글” 이중 섹션, 글 고정, 푸터 저작권 설정 흐름이 정리되어 운영과 사이트 브랜딩 관리에 적합합니다.
-   **다층 구독 체계**: 전역, 카테고리, 태그 단위의 다차원 RSS 구독을 지원하며 다국어 감지를 지원합니다.
-   **구성 가능한 시스템 거버넌스**: 설정 센터, 환경 변수 잠금, 설정 감사 로그, 배포 가이드가 하나로 연결되어 자체 배포와 Serverless 시나리오에서 일관되게 관리할 수 있습니다.
-   **클라우드 자산 전달**: S3 / R2 직접 업로드 권한 부여, 공개 자산 URL 거버넌스, 사용자 / 글 단위 객체 키 전략을 지원하여 CDN 및 스토리지 백엔드 전환이 용이합니다.

## 🏠 온라인 체험

-   **데모 사이트**: [https://demo.momei.app/](https://demo.momei.app/)

    -   이메일 `admin@example.com`, 비밀번호 `momei123456`으로 데모 관리자 계정에 로그인할 수 있습니다.

-   **공식 사이트**: [https://momei.app/](https://momei.app/)

    -   직접 계정을 만들어 일반 사용자 시점에서 제품을 체험할 수 있습니다.

-   **문서 사이트**: [https://docs.momei.app/ko-KR/](https://docs.momei.app/ko-KR/)
-   **문의 및 커뮤니티**:
    -   QQ 그룹: [807530287](http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=K3QRQlxv_y7KqLhdEZmfouxKv9WHLN_v&authKey=pfdJX4EkvKGQXQrtM5BR968EbtFc9WnVvz8AtLiSUTGZRgw3P1wBWESSDcEjoCZB&noverify=0&group_code=807530287)
    -   Discord: [CaoMeiYouRen 커뮤니티](https://discord.gg/6bfPevfyr6)

**화면 스크린샷**

![스크린샷 1](https://oss.cmyr.dev/images/20251221221052130.png)

![스크린샷 2](https://oss.cmyr.dev/images/20251221221240366.png)

![스크린샷 3](https://oss.cmyr.dev/images/20251221221300973.png)

## 🛠️ 기술 스택

-   **핵심 프레임워크**: [Nuxt](https://nuxt.com/)
-   **UI 프레임워크**: [Vue 3](https://vuejs.org/)
-   **프로그래밍 언어**: [TypeScript](https://www.typescriptlang.org/)
-   **스타일 전처리기**: [SCSS](https://sass-lang.com/)
-   **패키지 매니저**: [PNPM](https://pnpm.io/)
-   **코드 규범**: ESLint + Stylelint + Conventional Commits

## 📂 프로젝트 구조

-   `components/`: 재사용 가능한 Vue 컴포넌트
-   `pages/`: 파일 기반 페이지 라우트
-   `layouts/`: 페이지 레이아웃 템플릿
-   `server/`: Nitro 서버 API 인터페이스와 엔티티
-   `database/`: 데이터베이스 초기화 스크립트와 리소스
-   `i18n/`: 국제화 언어 설정 파일
-   `utils/`: 공용 유틸리티 함수와 범용 로직
-   `styles/`: 전역 SCSS 스타일 정의
-   `types/`: TypeScript 인터페이스와 타입 정의
-   `docs/`: 프로젝트 상세 문서와 규범 설명
-   `packages/cli/`: Hexo 마이그레이션 도구 CLI (독립 프로젝트)

## 🤖 AI 협업 개발 (AI Synergy)

이 프로젝트는 AI 보조 개발 흐름을 깊이 통합하고 있습니다. 사람 개발자든 AI 에이전트든 여기에서 가장 효율적인 협업 방식을 찾을 수 있습니다.

- **개발자라면 (Human)**:
  - 🚀 **[현대 AI 개발 가이드](https://docs.momei.app/ko-KR/guide/ai-development)** - AI 에이전트를 이끌어 반복 업무의 80%를 처리하는 방법을 확인할 수 있습니다.
  - 🛠️ **[환경 구축 (전통 방식)](https://docs.momei.app/ko-KR/guide/development)** - 자세한 로컬 환경 설정과 수동 개발 안내를 제공합니다.
- **AI 에이전트라면 (AI Agent / LLM)**:
  - 📜 **[AGENTS.md](./AGENTS.md)** - 유일한 프로젝트 수준 AI 사실 원본입니다. 먼저 읽고, 그다음 다른 진입 문서를 따르세요.
  - 🧭 현재 플랫폼에 전용 어댑터 파일이나 Rules가 있다면 도구 차이 보충 자료로만 취급하세요. `AGENTS.md`와 충돌하면 항상 `AGENTS.md`를 우선합니다.
  - 🗺️ **[프로젝트 맵](./docs/index.md)** - 프로젝트 컨텍스트를 빠르게 파악할 수 있습니다.
  - 프로젝트 내장 **PDTFC+ 사이클**에 따라 작업을 수행하세요.

## 📚 문서

자세한 개발 및 설계 문서는 [**모메이 블로그 문서 사이트**](https://docs.momei.app/ko-KR/)에서 확인할 수 있습니다.

주요 섹션:

-   [**빠른 시작**](https://docs.momei.app/ko-KR/guide/quick-start) - 원클릭 배포와 시작
-   [**솔루션 비교**](https://docs.momei.app/ko-KR/guide/comparison) - 왜 모메이를 선택해야 하는가?
-   [**배포 가이드**](https://docs.momei.app/ko-KR/guide/deploy) - Vercel / Docker / 사설 서버
-   [**환경 및 시스템 설정**](https://docs.momei.app/ko-KR/guide/variables) - 환경 변수, 설정 센터 매핑, 잠금 전략
-   [**개발 가이드**](https://docs.momei.app/ko-KR/guide/development) - 환경 구축과 기여
-   [**API 설계**](https://docs.momei.app/ko-KR/design/api) - 인터페이스 규범과 정의
-   [**데이터베이스 설계**](https://docs.momei.app/ko-KR/design/database) - 테이블 구조와 관계

## 📦 요구 사항

-   Node.js >= 20
-   PNPM (권장)

## ☁️ 배포 안내

### 지원 현황

Vercel, Netlify, Docker 또는 자체 호스팅 Node 환경에 배포하는 것을 권장합니다. Cloudflare를 연동해야 한다면 현재는 R2 객체 스토리지와 Scheduled Events 같은 주변 기능에만 사용하는 것이 좋습니다. TypeORM과 Node 런타임 의존성 때문에 현재 버전은 애플리케이션 본체를 Cloudflare Pages / Workers에 완전 배포하는 것을 지원하지 않습니다.

현재 버전의 배포 설정은 환경 변수를 중심으로 구성됩니다. 우선 [배포 가이드](https://docs.momei.app/ko-KR/guide/deploy)와 [환경 및 시스템 설정](https://docs.momei.app/ko-KR/guide/variables)을 읽고 핵심 변수를 맞춘 뒤, 필요에 따라 AI, 객체 스토리지, ASR, Webhook 예약 작업 등의 고급 기능을 단계적으로 활성화하는 것을 권장합니다.

아래 버튼을 눌러 Vercel에 원클릭 배포할 수 있습니다.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCaoMeiYouRen%2Fmomei)

### 데이터베이스 지원

모메이는 다음 데이터베이스를 기본 지원합니다.

-   **SQLite**: 기본 옵션이며 서버 설정이 필요 없고 개인 블로그에 적합합니다. `DATABASE_URL=sqlite://database/momei.sqlite` 설정을 권장합니다.
-   **MySQL / PostgreSQL**: 더 높은 수준의 데이터 관리가 필요한 사용자에게 적합하며, `DATABASE_URL` 프로토콜 헤더로 자동 추론됩니다.
-   **Cloudflare D1**: 계획 중입니다. 이 계획이 현재 버전에서 Cloudflare 런타임 전체를 지원한다는 뜻은 아닙니다. 현 단계에서는 외부 데이터베이스를 사용하고, 애플리케이션 본체는 Vercel, Docker 또는 자체 호스팅 Node 환경에 배치하는 것을 권장합니다.

자세한 내용은 [배포 가이드](https://docs.momei.app/ko-KR/guide/deploy)를 참고하세요.

## 🔄 Hexo 마이그레이션 도구

모메이는 Hexo 블로그 시스템에서 글을 빠르게 이전할 수 있도록 독립 CLI 도구를 제공합니다.

### 기능 특징

- ✅ 디렉터리 안의 모든 Markdown 파일 재귀 스캔
- ✅ Hexo Front-matter (YAML 형식) 정밀 파싱
- ✅ 발행 시간, 카테고리, 태그 등의 메타데이터 보존
- ✅ API Key를 통한 대량 가져오기 지원
- ✅ 동시 가져오기 지원으로 효율 향상
- ✅ Dry Run 모드 미리보기 지원

### 빠른 사용법

```bash
# CLI 디렉터리로 이동
cd packages/cli

# 의존성 설치
pnpm install

# 도구 빌드
pnpm build

# 가져오기 미리보기 (실제 가져오기 없음)
pnpm start import ./hexo-blog/source/_posts --dry-run --verbose

# 실제 가져오기
pnpm start import ./hexo-blog/source/_posts \
  --api-url https://your-blog.com \
  --api-key your-api-key-here
```

자세한 사용 설명은 [packages/cli/README.md](./packages/cli/README.md)를 확인하세요.

## 🚀 빠른 시작

### 의존성 설치

```bash
pnpm install
```

### 개발 서버 시작

```bash
pnpm dev
```

### 프로덕션 빌드

```bash
pnpm build
```

### 테스트 실행

```bash
pnpm test
```

### 코드 점검

```bash
pnpm lint
pnpm lint:i18n
```

## 👤 작성자

**CaoMeiYouRen**

-   Website: [https://blog.cmyr.ltd/](https://blog.cmyr.ltd/)
-   GitHub: [@CaoMeiYouRen](https://github.com/CaoMeiYouRen)

## 🤝 기여

기여, 질문, 새로운 기능 제안을 환영합니다.
문제가 있다면 [Issues](https://github.com/CaoMeiYouRen/momei/issues)를 확인하세요.
기여 가이드는 [CONTRIBUTING.md](./CONTRIBUTING.md)를 참고하세요.

## 💰 지원

이 프로젝트가 도움이 되었다면 ⭐️를 남겨 주세요. 감사합니다.

<a href="https://afdian.com/@CaoMeiYouRen">
  <img src="https://oss.cmyr.dev/images/202306192324870.png" width="312px" height="78px" alt="아이파디엔에서 후원하기">
</a>

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=CaoMeiYouRen/momei&type=Date)](https://star-history.com/#CaoMeiYouRen/momei&Date)

## 📝 License

Copyright © 2025 [CaoMeiYouRen](https://github.com/CaoMeiYouRen).

이 프로젝트는 이중 라이선스를 사용합니다.
- 코드 부분: [MIT](./LICENSE) 라이선스.
- 문서 부분: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 라이선스.

**이 프로젝트의 Logo는 위 라이선스 범위에 포함되지 않으며, 이미지 저작권은 프로젝트 소유자 [CaoMeiYouRen](https://github.com/CaoMeiYouRen)에게 있습니다. 상업적으로 사용하려면 Logo를 교체해야 합니다. 비상업적 사용은 프로젝트 소유자의 권익을 해치지 않는 범위에서 허용됩니다.**

---

_This README was generated with ❤️ by [cmyr-template-cli](https://github.com/CaoMeiYouRen/cmyr-template-cli)_
