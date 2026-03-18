<h1 align="center">
  <img src="./public/logo.png" alt="Momei" width="128" />
  <br />
  Momei
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
  <a href="./README.md">简体中文</a> | <a href="./README.zh-TW.md">繁體中文</a> | <a href="./README.en-US.md">English</a> | <a href="./README.ko-KR.md">한국어</a>
</p>

<p align="center">
  <a href="https://momei.app/"><strong>🌐 메인 사이트</strong></a> &nbsp;|&nbsp;
  <a href="https://docs.momei.app/ko-KR/"><strong>📚 문서</strong></a>
</p>

> **Momei - AI 기반 네이티브 국제화 개발자 블로그 플랫폼**
>
> **AI Powered, Global Creation**

## 📖 소개

Momei는 **Nuxt** 기반의 현대적인 블로그 플랫폼입니다. AI와 깊은 국제화 설계를 통해 기술 개발자와 글로벌 창작자에게 효율적이고 지능적인 글쓰기 환경을 제공합니다.

## ✨ 주요 기능

- AI 제목 / 요약 / 번역 / 태그 추천
- ASR, 재사용 가능한 음성 입력, AI 이미지, Memos / WechatSync 수동 배포, 예약 작업을 포함한 멀티모달 흐름
- UI와 콘텐츠 관리에 걸친 네이티브 다국어 지원
- Nuxt + Vue 3 + TypeScript 기반 현대 스택
- 사용자 정의 Slug를 통한 SEO 친화적 마이그레이션
- Markdown 중심 작성 경험
- 최신 글 / 인기 글 홈 편성과 게시글 고정, 푸터 저작권 설정까지 연결된 운영 의미 체계
- 분류 / 태그 단위까지 확장되는 Feed 구독 체계
- 설정 센터와 환경 변수 잠금 기반 운영 거버넌스

## 🏠 라이브 데모

- Demo: https://demo.momei.app/
  - `admin@example.com` / `momei123456`
- Main Site: https://momei.app/
- Docs: https://docs.momei.app/ko-KR/
- Community: QQ 807530287 / Discord https://discord.gg/6bfPevfyr6

## 🛠️ 기술 스택

- Framework: Nuxt
- UI: Vue 3
- Language: TypeScript
- Style: SCSS
- Package Manager: PNPM
- Quality: ESLint + Stylelint + Conventional Commits

## 📂 프로젝트 구조

- `components/`
- `pages/`
- `layouts/`
- `server/`
- `database/`
- `i18n/`
- `utils/`
- `styles/`
- `types/`
- `docs/`
- `packages/cli/`

## 🤖 AI 협업 개발

- 사람 개발자라면 [AI 협업 개발 가이드](./docs/ko-KR/guide/ai-development.md)와 [개발 가이드](./docs/ko-KR/guide/development.md)를 먼저 읽는 것이 좋습니다.
- AI 에이전트라면 [AGENTS.md](./AGENTS.md)와 프로젝트 문서를 먼저 읽고 PDTFC+ 흐름을 따라야 합니다.

## 📚 문서

자세한 설계와 개발 문서는 https://docs.momei.app/ko-KR/ 에서 확인할 수 있습니다.

주요 링크:

- [빠른 시작](https://docs.momei.app/ko-KR/guide/quick-start)
- [솔루션 비교](https://docs.momei.app/ko-KR/guide/comparison)
- [배포 가이드](https://docs.momei.app/ko-KR/guide/deploy)
- [변수 및 설정 매핑](https://docs.momei.app/ko-KR/guide/variables)
- [개발 가이드](https://docs.momei.app/ko-KR/guide/development)
- [API 설계](https://docs.momei.app/ko-KR/design/api)
- [데이터베이스 설계](https://docs.momei.app/ko-KR/design/database)

## 📦 요구 사항

- Node.js >= 20
- PNPM 권장

## ☁️ 배포

Vercel, Docker, 또는 자체 호스팅 Node 환경을 기본 배포 경로로 권장합니다. Cloudflare는 현재 R2 객체 스토리지나 Scheduled Events 같은 외곽 기능 연계 용도로만 보는 것이 안전하며, TypeORM 및 Node 런타임 의존성 때문에 애플리케이션 본체를 Cloudflare Pages / Workers에 완전 배포하는 것은 아직 지원되지 않습니다. 먼저 [배포 가이드](https://docs.momei.app/ko-KR/guide/deploy)와 [변수 및 설정 매핑](https://docs.momei.app/ko-KR/guide/variables)을 읽고 핵심 환경 변수를 맞춘 뒤, AI / 스토리지 / 작업 기능을 단계적으로 켜는 것이 좋습니다.

### 데이터베이스 지원

- SQLite
- MySQL / PostgreSQL
- Cloudflare D1은 계획 단계이며, 이것이 현재 Cloudflare 런타임 전체 지원을 의미하지는 않습니다.

## 🔄 Hexo 마이그레이션 CLI

Momei는 Hexo 등에서 Markdown + Front-matter 기반으로 게시글을 가져오는 별도 CLI를 제공합니다.

```bash
cd packages/cli
pnpm install
pnpm build
pnpm start import ./hexo-blog/source/_posts --dry-run --verbose
```

## 🚀 빠른 명령

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
pnpm lint
```

## 👤 저자

**CaoMeiYouRen**

- Website: https://blog.cmyr.ltd/
- GitHub: https://github.com/CaoMeiYouRen

## 🤝 기여

이슈, PR, 기능 제안을 환영합니다. 자세한 참여 방식은 [CONTRIBUTING.md](./CONTRIBUTING.md)를 참고하세요.

## 📝 라이선스

- Code: [MIT](./LICENSE)
- Documentation: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
