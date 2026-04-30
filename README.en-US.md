<h1 align="center">
  <img src="./public/logo.png" alt="Momei Blog" width="128" />
  <br />
  Momei Blog
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
  <a href="./README.md">简体中文</a> |
  <a href="./README.zh-TW.md">繁體中文</a> |
  <a href="./README.en-US.md">English</a> |
  <a href="./README.ko-KR.md">한국어</a> |
  <a href="./README.ja-JP.md">日本語</a>
</p>

<p align="center">
  <a href="https://momei.app/"><strong>🌐 Main Site</strong></a> &nbsp;|&nbsp;
  <a href="https://docs.momei.app/en-US/"><strong>📚 Docs</strong></a>
</p>

> **Momei Blog - An AI-driven, native i18n blog platform for developers.**
>
> **AI Powered, Global Creation.**

## 📖 Introduction

Momei Blog is a modern blog platform built on **Nuxt**. It is designed to provide efficient and intelligent creation workflows for technical developers and cross-border content creators through AI and deep internationalization support. From smart translation and automated summaries to multilingual route management, Momei helps you connect with readers around the world.

## ✨ Core Features

-   **AI Driven**: Deeply integrates AI assistants and supports fully automated translation, smart titles, summary generation, and more to significantly improve writing efficiency.
-   **Multimodal Content Workflow**: Already supports AI-generated illustrations, ASR, reusable voice input, manual Memos / WechatSync distribution, and scheduled-task automation, covering the full path from idea capture to publishing.
-   **Native Internationalization (i18n)**: Built-in multilingual support with deep integration from UI to content management, helping you reach global audiences with ease.
-   **Modern Tech Stack**: Built on Nuxt (Vue 3 + TypeScript), with hybrid SSG / SSR rendering and strong runtime performance.
-   **Smooth Migration**: Supports custom URL slugs (path aliases), ensuring near-zero SEO loss when migrating from legacy blogs.
-   **Markdown Authoring**: A concise and efficient Markdown editor with real-time preview and drag-and-drop image upload.
-   **Content Orchestration and Brand Semantics**: The homepage now includes “latest posts + popular posts” dual sections, post pinning, and a fully connected footer copyright configuration flow for operations and branding.
-   **Multi-level Subscription**: Multi-dimensional RSS subscriptions across global, category, and tag scopes, with multilingual detection support.
-   **Read-only Comment Translation**: Readers can view AI-translated comments in the current UI language while keeping source-language badges, original-text toggles, cache reuse, and the existing quota / rate-limit governance.
-   **Configurable System Governance**: The settings center, environment variable locking, configuration audit logs, and deployment guidance have been aligned for both self-hosted and serverless scenarios.
-   **Cloud Asset Delivery**: Supports S3 / R2 direct-upload authorization, public asset URL governance, and object key strategies scoped by user and post ownership, making it easier to switch CDN and storage backends.

## 🏠 Online Experience

-   **Demo Site**: [https://demo.momei.app/](https://demo.momei.app/)

    -   You can sign in with the demo admin account using email `admin@example.com` and password `momei123456`.

-   **Official Site**: [https://momei.app/](https://momei.app/)

    -   You can register your own account to experience the product from a regular user perspective.

-   **Docs Site**: [https://docs.momei.app/en-US/](https://docs.momei.app/en-US/)
-   **Feedback and Community**:
    -   QQ Group: [807530287](http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=K3QRQlxv_y7KqLhdEZmfouxKv9WHLN_v&authKey=pfdJX4EkvKGQXQrtM5BR968EbtFc9WnVvz8AtLiSUTGZRgw3P1wBWESSDcEjoCZB&noverify=0&group_code=807530287)
    -   Discord: [CaoMeiYouRen's Community](https://discord.gg/6bfPevfyr6)

**Screenshots**

![Screenshot 1](https://oss.cmyr.dev/images/20251221221052130.png)

![Screenshot 2](https://oss.cmyr.dev/images/20251221221240366.png)

![Screenshot 3](https://oss.cmyr.dev/images/20251221221300973.png)

## 🛠️ Tech Stack

-   **Core Framework**: [Nuxt](https://nuxt.com/)
-   **UI Framework**: [Vue 3](https://vuejs.org/)
-   **Programming Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Style Preprocessor**: [SCSS](https://sass-lang.com/)
-   **Package Manager**: [PNPM](https://pnpm.io/)
-   **Code Standards**: ESLint + Stylelint + Conventional Commits

## 📂 Project Structure

-   `components/`: Reusable Vue components
-   `pages/`: File-based page routes
-   `layouts/`: Page layout templates
-   `server/`: Nitro server APIs and entities
-   `database/`: Database initialization scripts and resources
-   `i18n/`: Internationalization language configuration files
-   `utils/`: Shared utilities and common logic
-   `styles/`: Global SCSS style definitions
-   `types/`: TypeScript interfaces and type definitions
-   `docs/`: Detailed project docs and standards
-   `packages/cli/`: Hexo migration CLI (independent project)

## 🤖 AI Synergy

This project deeply integrates AI-assisted development workflows. Whether you are a human developer or an AI agent, you can find the most efficient way to collaborate here.

- **If you are a developer (Human)**:
  - 🚀 **[Modern AI Development Guide](https://docs.momei.app/en-US/guide/ai-development)** - Learn how to lead AI agents to complete 80% of repetitive work.
  - 🛠️ **[Environment Setup (Traditional)](https://docs.momei.app/en-US/guide/development)** - Detailed local setup instructions and manual development guidance.
- **If you are an AI agent (AI Agent / LLM)**:
  - 📜 **[AGENTS.md](./AGENTS.md)** - The only project-level AI source of truth. Read it first, then follow any other entry instructions.
  - 🧭 If the current platform provides dedicated adapter files or Rules, treat them only as tool-difference supplements. If anything conflicts with `AGENTS.md`, `AGENTS.md` always wins.
  - 🗺️ **[Project Map](./docs/index.md)** - Quickly establish project context.
  - Follow the built-in **PDTFC+ cycle** when executing tasks.

## 📚 Documentation

Visit the [**Momei Blog Documentation Site**](https://docs.momei.app/en-US/) for detailed development and design docs.

Main Sections:

-   [**Quick Start**](https://docs.momei.app/en-US/guide/quick-start) - One-click deployment and startup
-   [**Comparison**](https://docs.momei.app/en-US/guide/comparison) - Why choose Momei?
-   [**Enhanced Pack**](https://docs.momei.app/en-US/guide/enhanced-pack) - Batch translation, distribution tracking & content asset unification
-   [**Deploy Guide**](https://docs.momei.app/en-US/guide/deploy) - Vercel / Docker / private server
-   [**Variables and System Settings**](https://docs.momei.app/en-US/guide/variables) - Environment variables, settings mapping, and locking strategy
-   [**Development Guide**](https://docs.momei.app/en-US/guide/development) - Environment setup and contribution
-   [**API Design**](https://docs.momei.app/en-US/design/api) - Interface standards and definitions
-   [**Database Design**](https://docs.momei.app/en-US/design/database) - Table structures and relations

## 📦 Requirements

-   Node.js >= 20
-   PNPM (Recommended)

## ☁️ Deployment

### Support Status

It is recommended to deploy on Vercel, Netlify, Docker, or a self-hosted Node environment. If you need Cloudflare integration, it is currently recommended only for peripheral capabilities such as R2 object storage and Scheduled Events. Due to TypeORM and Node runtime dependencies, the current version does not support deploying the full application runtime to Cloudflare Pages / Workers.

The current deployment model is environment-variable first. It is recommended to read the [Deploy Guide](https://docs.momei.app/en-US/guide/deploy) and [Variables and System Settings](https://docs.momei.app/en-US/guide/variables) first, complete the core variables, and then enable AI, object storage, ASR, webhook scheduled tasks, and other enhanced capabilities as needed.

Click the button below to deploy to Vercel with one click.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCaoMeiYouRen%2Fmomei)

### Database Support

Momei natively supports the following databases:

-   **SQLite**: The default option. No server setup is required, and it is suitable for personal blogs. Recommended setting: `DATABASE_URL=sqlite://database/momei.sqlite`.
-   **MySQL / PostgreSQL**: Suitable for users with higher data-management requirements. The database type is inferred automatically from the `DATABASE_URL` protocol.
-   **Cloudflare D1**: Planned. This plan does not mean the current version already supports full-site deployment on the Cloudflare runtime. At this stage, it is still recommended to use an external database and deploy the main app on Vercel, Docker, or a self-hosted Node environment.

For details, see the [Deploy Guide](https://docs.momei.app/en-US/guide/deploy).

## 🔄 Hexo Migration Tool

Momei provides an independent CLI tool to help you quickly migrate articles from a Hexo blog.

### Features

- ✅ Recursively scan all Markdown files in a directory
- ✅ Precisely parse Hexo Front-matter (YAML format)
- ✅ Preserve metadata such as publish time, categories, and tags
- ✅ Support batch import via API Key
- ✅ Support concurrent imports for better efficiency
- ✅ Support Dry Run preview mode

### Quick Usage

```bash
# Enter the CLI directory
cd packages/cli

# Install dependencies
pnpm install

# Build the tool
pnpm build

# Preview import (without actually importing)
pnpm start import ./hexo-blog/source/_posts --dry-run --verbose

# Run the actual import
pnpm start import ./hexo-blog/source/_posts \
  --api-url https://your-blog.com \
  --api-key your-api-key-here
```

For detailed usage instructions, see [packages/cli/README.md](./packages/cli/README.md).

## 🚀 Quick Start

### Install Dependencies

```bash
pnpm install
```

### Start the Development Server

```bash
pnpm dev
```

### Build the Production Version

```bash
pnpm build
```

### Run Tests

```bash
pnpm test
```

### Code Check

```bash
pnpm lint
pnpm lint:i18n
```

## 👤 Author

**CaoMeiYouRen**

-   Website: [https://blog.cmyr.ltd/](https://blog.cmyr.ltd/)
-   GitHub: [@CaoMeiYouRen](https://github.com/CaoMeiYouRen)

## 🤝 Contributing

Contributions, questions, and new feature proposals are welcome.
If you have any questions, please check the [Issues](https://github.com/CaoMeiYouRen/momei/issues).
For contribution details, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## 💰 Support

If you find this project useful, please give it a ⭐️. Thank you.

<a href="https://afdian.com/@CaoMeiYouRen">
  <img src="https://oss.cmyr.dev/images/202306192324870.png" width="312px" height="78px" alt="Support me on Afdian">
</a>

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=CaoMeiYouRen/momei&type=Date)](https://star-history.com/#CaoMeiYouRen/momei&Date)

## 📝 License

Copyright © 2025 [CaoMeiYouRen](https://github.com/CaoMeiYouRen).

This project is dual-licensed:
- Code: Licensed under [MIT](./LICENSE).
- Documentation: Licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).

**The project logo is not covered by the licenses above. The copyright of the logo is retained by the project owner [CaoMeiYouRen](https://github.com/CaoMeiYouRen). If you plan to use this project commercially, you must replace the logo. Non-commercial use is allowed as long as it does not affect the rights of the project owner.**

---

_This README was generated with ❤️ by [cmyr-template-cli](https://github.com/CaoMeiYouRen/cmyr-template-cli)_
