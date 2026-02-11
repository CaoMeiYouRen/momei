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
  <a href="https://docs.momei.app/en-US/" target="_blank">
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
  <a href="./README.md">简体中文</a> | <a href="./README.en-US.md">English</a>
</p>

<p align="center">
  <a href="https://momei.app/"><strong>🌐 Main Site</strong></a> &nbsp;|&nbsp;
  <a href="https://docs.momei.app/en-US/"><strong>📚 Docs</strong></a>
</p>

> **Momei - AI-driven, native i18n developer blog platform.**
>
> **AI Powered, Global Creation.**

## 📖 Introduction

Momei is a modern blog platform built on **Nuxt**. It aims to provide an efficient and intelligent creative experience for technical developers and cross-border content creators through AI and deep internationalization support. Whether it's smart translation, automated summaries, or multi-language routing management, Momei helps you easily connect with global readers.

## ✨ Key Features

-   **AI Driven**: Deeply integrated AI assistant, supporting automated translation, smart titles, summary generation, etc., significantly improving creative efficiency.
-   **Native i18n**: Built-in multi-language support, from UI to content management, helping you easily reach global readers.
-   **Modern Tech Stack**: Built on Nuxt (Vue 3 + TypeScript), supporting SSG/SSR mixed rendering with excellent performance.
-   **Smooth Migration**: Supports custom URL Slugs (path aliases), ensuring zero SEO loss when migrating from legacy blogs.
-   **Markdown Creation**: Concise and efficient Markdown editor with real-time preview and drag-and-drop image upload.
-   **Multi-layer Subscription**: Global, category, and tag multi-dimensional RSS feeds with multi-language detection.
-   **Multi-terminal (Planned)**: Future support for Tauri desktop applications, enabling offline writing and cloud synchronization.

## 🏠 Live Demo

-   **Demo Site**: [https://demo.momei.app/](https://demo.momei.app/)
    -   Login with email `admin@example.com`, password `momei123456`.
-   **Official Site**: [https://momei.app/](https://momei.app/)
    -   Register your own account to view from a user perspective.
-   **Documentation**: [https://docs.momei.app/en-US/](https://docs.momei.app/en-US/)
-   **Feedback & Community**:
    -   QQ Group: [807530287](http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=K3QRQlxv_y7KqLhdEZmfouxKv9WHLN_v&authKey=pfdJX4EkvKGQXQrtM5BR968EbtFc9WnVvz8AtLiSUTGZRgw3P1wBWESSDcEjoCZB&noverify=0&group_code=807530287)
    -   Discord: [CaoMeiYouRen's Community](https://discord.gg/6bfPevfyr6)

**Screenshots**

![Screenshot 1](https://oss.cmyr.dev/images/20251221221052130.png)

![Screenshot 2](https://oss.cmyr.dev/images/20251221221240366.png)

![Screenshot 3](https://oss.cmyr.dev/images/20251221221300973.png)

## 🛠️ Tech Stack

-   **Framework**: [Nuxt](https://nuxt.com/)
-   **UI Library**: [Vue 3](https://vuejs.org/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Style**: [SCSS](https://sass-lang.com/)
-   **Package Manager**: [PNPM](https://pnpm.io/)
-   **Linting**: ESLint + Stylelint + Conventional Commits

## 📂 Project Structure

-   `components/`: Reusable Vue components
-   `pages/`: File-based routing
-   `layouts/`: Page layout templates
-   `server/`: Nitro server API and entities
-   `database/`: Database initialization scripts and resources
-   `i18n/`: Internationalization language files
-   `utils/`: Shared utilities and common logic
-   `styles/`: Global SCSS definitions
-   `types/`: TypeScript interfaces and definitions
-   `docs/`: Detailed project documentation and standards
-   `packages/cli/`: Hexo migration tool CLI (independent project)

## 🤖 AI Synergy

This project deeply integrates AI-assisted development workflows. Whether you are a human developer or an AI agent, you can find the most efficient way to collaborate here.

- **For Developers (Human)**:
  - 🚀 **[Modern AI Dev Guide](https://docs.momei.app/en-US/guide/ai-development)** - Learn how to lead AI agents to complete 80% of repetitive tasks.
  - 🛠️ **[Environment Setup](https://docs.momei.app/en-US/guide/development)** - Detailed guide for local setup and manual development.
- **For AI Agents (AI Agent / LLM)**:
  - 📜 **[AGENTS.md](./AGENTS.md)** - Your core behavior guidelines and identity definition.
  - 🗺️ **[Project Map](https://docs.momei.app/en-US/index)** - Quickly establish project context.
  - Follow the built-in **PDTFC+ cycle** to execute tasks.

## 📚 Documentation

Visit the [**Momei Documentation Site**](https://docs.momei.app/en-US/) for detailed design and guides.

Main Sections:

-   [**Quick Start**](https://docs.momei.app/en-US/guide/quick-start) - One-click deployment
-   [**Comparison**](https://docs.momei.app/en-US/plan/comparison) - Why choose Momei?
-   [**Deploy Guide**](https://docs.momei.app/en-US/guide/deploy) - Vercel/Docker/Self-host
-   [**Dev Guide**](https://docs.momei.app/en-US/guide/development) - Setup and contribution
-   [**API Design**](https://docs.momei.app/en-US/design/api) - Interface standards
-   [**Database Design**](https://docs.momei.app/en-US/design/database) - Schema and relations

## 📦 Requirements

-   Node.js >= 20
-   PNPM (Recommended)

## ☁️ Deployment

### Support

Recommended deployment options include Vercel, Netlify, Cloudflare, or Docker.

Click the button below for one-click deployment to Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCaoMeiYouRen%2Fmomei)

### Database Support

Momei natively supports:

-   **SQLite**: Default option, no server needed, ideal for personal blogs. Recommended: `DATABASE_URL=sqlite://database/momei.sqlite`.
-   **MySQL / PostgreSQL**: Ideal for higher data management needs, auto-inferred via `DATABASE_URL`.
-   **Cloudflare D1**: Planned. Suggested to use external DBs like Neon or TiDB Cloud for Cloudflare deployments.

See [Deploy Guide](https://docs.momei.app/en-US/guide/deploy) for details.

## 🔄 Hexo Migration Tool

Momei provides an independent CLI tool to help you migrate articles from Hexo.

### Features

- ✅ Recursively scan Markdown files
- ✅ Parse Hexo Front-matter (YAML)
- ✅ Preserves metadata (date, categories, tags)
- ✅ Support batch import via API Key
- ✅ Concurrent import for efficiency
- ✅ Dry Run mode

### Quick Start

```bash
# Go to CLI directory
cd packages/cli

# Install dependencies
pnpm install

# Build tool
pnpm build

# Preview import (Dry Run)
pnpm start import ./hexo-blog/source/_posts --dry-run --verbose

# Actual import
pnpm start import ./hexo-blog/source/_posts \
  --api-url https://your-blog.com \
  --api-key your-api-key-here
```

See [packages/cli/README.md](./packages/cli/README.md) for full instructions.

## 🚀 Getting Started

### Install Dependencies

```bash
pnpm install
```

### Start Dev Server

```bash
pnpm dev
```

### Build for Production

```bash
pnpm build
```

### Run Tests

```bash
pnpm test
```

### Linting

```bash
pnpm lint
```

## 👤 Author

**CaoMeiYouRen**

-   Website: [https://blog.cmyr.ltd/](https://blog.cmyr.ltd/)
-   GitHub: [@CaoMeiYouRen](https://github.com/CaoMeiYouRen)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!
Check the [Issues](https://github.com/CaoMeiYouRen/momei/issues).
See [CONTRIBUTING.md](./CONTRIBUTING.md) for guide.

## 💰 Support

Give a ⭐️ if this project helped you!

<a href="https://afdian.com/@CaoMeiYouRen">
  <img src="https://oss.cmyr.dev/images/202306192324870.png" width="312px" height="78px" alt="Support me on Afdian">
</a>

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=CaoMeiYouRen/momei&type=Date)](https://star-history.com/#CaoMeiYouRen/momei&Date)

## 📝 License

Copyright © 2025 [CaoMeiYouRen](https://github.com/CaoMeiYouRen).

This project is dual-licensed:
- Code: Under [MIT](./LICENSE) license.
- Documentation: Under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) license.

**The Logo of this project is NOT under the licenses above. Copyright of images is reserved by the project owner [CaoMeiYouRen](https://github.com/CaoMeiYouRen). For commercial use, the Logo must be replaced. Non-commercial use is allowed as long as it does not affect owner's rights.**

---

_This README was generated with ❤️ by [cmyr-template-cli](https://github.com/CaoMeiYouRen/cmyr-template-cli)_
