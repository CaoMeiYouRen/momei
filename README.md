<h1 align="center">
  <img src="./public/logo.png" alt="墨梅博客" width="128" />
  <br />
  墨梅博客
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
  <a href="https://docs.momei.app/" target="_blank">
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
  <a href="https://momei.app/"><strong>🌐 主站</strong></a> &nbsp;|&nbsp;
  <a href="https://docs.momei.app/"><strong>📚 文档站</strong></a>
</p>

> **墨梅博客 - AI 驱动、原生国际化的开发者博客平台。**
>
> **AI 赋能，全球创作。**

## 📖 简介

墨梅博客 是一个基于 **Nuxt** 构建的现代化博客平台。它旨在通过 AI 和深度的国际化支持，为技术开发者和跨境内容创作者提供高效、智能的创作体验。无论是智能翻译、自动化摘要，还是多语言路由管理，墨梅都能帮您轻松连接全球读者。

## ✨ 核心特性

-   **AI 驱动**: 深度集成 AI 助手，支持全自动翻译、智能标题、摘要生成等功能，大幅提升创作效率。
-   **多模态内容工作流**: 已支持 AI 配图、ASR、可复用语音输入、Memos / WechatSync 手动分发与定时任务自动化，覆盖从灵感采集到发布的完整链路。
-   **原生国际化 (i18n)**: 内置多语言支持，从 UI 到内容管理的深度集成，助你轻松触达全球读者。
-   **现代化技术栈**: 基于 Nuxt (Vue 3 + TypeScript) 构建，支持 SSG/SSR 混合渲染，性能卓越。
-   **平滑迁移**: 支持自定义 URL Slug (路径别名)，确保从旧博客迁移时 SEO 零损失。
-   **Markdown 创作**: 简洁高效的 Markdown 编辑器，支持实时预览和图片拖拽上传。
-   **内容编排与品牌语义**: 首页“最新文章 + 热门文章”双区块、文章置顶和页脚版权配置链路已收口，便于运营与站点品牌管理。
-   **多层级订阅**: 全局、分类及标签的多维度 RSS 订阅，支持多语言探测。
-   **可配置的系统治理**: 系统设置中心、环境变量锁定、配置审计日志和部署指引已打通，便于在自部署与 Serverless 场景中统一管理。
-   **云端资源交付**: 已支持 S3 / R2 直传授权、资源公共地址治理与按用户 / 文章归属收敛的对象键策略，便于切换 CDN 与存储后端。

## 🏠 在线体验

-   **演示站点**: [https://demo.momei.app/](https://demo.momei.app/)

    -   您可以通过邮箱 `admin@example.com`，密码`momei123456`登录演示用管理员账号。

-   **正式站点**: [https://momei.app/](https://momei.app/)

    -   您可以注册自己的账号查看用户视角。

-   **文档站点**: [https://docs.momei.app/](https://docs.momei.app/)
-   **问题反馈和交流群**：
    -   QQ 群: [807530287](http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=K3QRQlxv_y7KqLhdEZmfouxKv9WHLN_v&authKey=pfdJX4EkvKGQXQrtM5BR968EbtFc9WnVvz8AtLiSUTGZRgw3P1wBWESSDcEjoCZB&noverify=0&group_code=807530287)
    -   Discord: [草梅友仁的交流群](https://discord.gg/6bfPevfyr6)

**页面截图**

![QQ截图20251221215342](https://oss.cmyr.dev/images/20251221221052130.png)

![QQ截图20251221221235](https://oss.cmyr.dev/images/20251221221240366.png)

![QQ截图20251221215644](https://oss.cmyr.dev/images/20251221221300973.png)

## 🛠️ 技术栈

-   **核心框架**: [Nuxt](https://nuxt.com/)
-   **UI 框架**: [Vue 3](https://vuejs.org/)
-   **编程语言**: [TypeScript](https://www.typescriptlang.org/)
-   **样式预处理**: [SCSS](https://sass-lang.com/)
-   **包管理器**: [PNPM](https://pnpm.io/)
-   **代码规范**: ESLint + Stylelint + Conventional Commits

## 📂 项目结构

-   `components/`: 可复用的 Vue 组件
-   `pages/`: 基于文件的页面路由
-   `layouts/`: 页面布局模版
-   `server/`: Nitro 服务端 API 接口与实体
-   `database/`: 数据库初始化脚本与资源
-   `i18n/`: 国际化语言配置文件
-   `utils/`: 共享工具函数与通用逻辑
-   `styles/`: 全局 SCSS 样式定义
-   `types/`: TypeScript 接口与类型定义
-   `docs/`: 项目详细文档与规范说明
-   `packages/cli/`: Hexo 迁移工具 CLI (独立项目)

## 🤖 AI 协同开发 (AI Synergy)

本项目深度集成了 AI 辅助开发流，无论你是人类开发者还是 AI 代理，都能在这里找到最高效的协作方式。

- **如果你是开发者 (Human)**:
  - 🚀 **[现代 AI 开发指南](./docs/guide/ai-development.md)** - 了解如何指挥 AI 智能体完成 80% 的重复性任务。
  - 🛠️ **[环境搭建 (传统方式)](./docs/guide/development.md)** - 详细的本地环境配置与手动开发说明。
- **如果你是 AI 代理 (AI Agent / LLM)**:
  - 📜 **[AGENTS.md](./AGENTS.md)** - 你的核心行为准则与身份定义。
  - 🗺️ **[项目地图](./docs/index.md)** - 快速建立项目上下文。
  - 遵循项目内置的 **PDTFC+ 循环** 执行任务。

## 📚 文档

详细的开发和设计文档请访问：[**墨梅博客文档站**](https://docs.momei.app/)

主要章节：

-   [**快速开始**](https://docs.momei.app/guide/quick-start) - 一键部署与启动
-   [**方案对比**](https://docs.momei.app/plan/comparison) - 为什么选择墨梅?
-   [**部署指南**](https://docs.momei.app/guide/deploy) - Vercel/Docker/私有服务器
-   [**环境与系统设置**](https://docs.momei.app/guide/variables) - 环境变量、设置中心映射与锁定策略
-   [**开发指南**](https://docs.momei.app/guide/development) - 环境搭建与贡献
-   [**API 设计**](https://docs.momei.app/design/api) - 接口规范与定义
-   [**数据库设计**](https://docs.momei.app/design/database) - 表结构与关系

## 📦 依赖要求

-   Node.js >= 20
-   PNPM (推荐)

## ☁️ 部署说明

### 支持情况

建议使用 Vercel、Netlify、Docker 或自托管 Node 环境进行部署。若你需要接入 Cloudflare，当前仅建议用于 R2 对象存储与 Scheduled Events 等外围能力。受 TypeORM 与 Node 运行时依赖限制，当前版本暂不支持将应用主体完整部署到 Cloudflare Pages / Workers。

当前版本的部署配置以环境变量为主，推荐优先阅读 [部署指南](https://docs.momei.app/guide/deploy) 和 [环境与系统设置](https://docs.momei.app/guide/variables)，先完成核心变量，再按需启用 AI、对象存储、ASR、Webhook 定时任务等增强能力。

点击下方按钮一键部署到 Vercel。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCaoMeiYouRen%2Fmomei)

### 数据库支持

墨梅原生支持以下数据库：

-   **SQLite**: 默认选项，无需配置服务器，适合个人博客。推荐设置 `DATABASE_URL=sqlite://database/momei.sqlite`。
-   **MySQL / PostgreSQL**: 适合有更高数据管理需求的用户，通过 `DATABASE_URL` 协议头自动推断。
-   **Cloudflare D1**: 计划中。该规划不代表当前版本已支持 Cloudflare 运行时整站部署；现阶段仍建议使用外部数据库，并将应用主体部署在 Vercel、Docker 或自托管 Node 环境。

详情请参考 [部署指南](https://docs.momei.app/guide/deploy)。

## 🔄 Hexo 迁移工具

墨梅提供了独立的 CLI 工具，帮助你从 Hexo 博客系统快速迁移文章。

### 功能特性

- ✅ 递归扫描目录中的所有 Markdown 文件
- ✅ 精确解析 Hexo Front-matter (YAML 格式)
- ✅ 保留发布时间、分类、标签等元数据
- ✅ 支持通过 API Key 批量导入
- ✅ 支持并发导入，提高效率
- ✅ 支持 Dry Run 模式预览

### 快速使用

```bash
# 进入 CLI 目录
cd packages/cli

# 安装依赖
pnpm install

# 构建工具
pnpm build

# 预览导入（不实际导入）
pnpm start import ./hexo-blog/source/_posts --dry-run --verbose

# 正式导入
pnpm start import ./hexo-blog/source/_posts \
  --api-url https://your-blog.com \
  --api-key your-api-key-here
```

详细使用说明请查看 [packages/cli/README.md](./packages/cli/README.md)。

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 运行测试

```bash
pnpm test
```

### 代码检查

```bash
pnpm lint
```

## 👤 作者

**CaoMeiYouRen**

-   Website: [https://blog.cmyr.ltd/](https://blog.cmyr.ltd/)
-   GitHub: [@CaoMeiYouRen](https://github.com/CaoMeiYouRen)

## 🤝 贡献

欢迎贡献、提问或提出新功能！
如有问题请查看 [Issues](https://github.com/CaoMeiYouRen/momei/issues).
贡献指南请查看 [CONTRIBUTING.md](./CONTRIBUTING.md).

## 💰 支持

如果觉得这个项目有用的话请给一颗 ⭐️，非常感谢！

<a href="https://afdian.com/@CaoMeiYouRen">
  <img src="https://oss.cmyr.dev/images/202306192324870.png" width="312px" height="78px" alt="在爱发电支持我">
</a>

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=CaoMeiYouRen/momei&type=Date)](https://star-history.com/#CaoMeiYouRen/momei&Date)

## 📝 License

Copyright © 2025 [CaoMeiYouRen](https://github.com/CaoMeiYouRen).

本项目采用双重许可：
- 代码部分：根据 [MIT](./LICENSE) 许可证授权。
- 文档部分：根据 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans) 许可证授权。

**本项目的 Logo 不在上述 License 协议范围内，图片版权由项目所有者 [CaoMeiYouRen](https://github.com/CaoMeiYouRen) 保留。如要进行商业化使用，需更换 Logo。非商业化使用的情况允许在不影响项目所有者权益的情况下使用。**

---

_This README was generated with ❤️ by [cmyr-template-cli](https://github.com/CaoMeiYouRen/cmyr-template-cli)_
