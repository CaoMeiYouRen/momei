<h1 align="center">
  <img src="./public/logo.png" alt="墨梅 (Momei)" width="128" />
  <br />
  墨梅 (Momei)
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
</p>

<p align="center">
  <a href="https://momei.app/"><strong>🌐 主站</strong></a> &nbsp;|&nbsp;
  <a href="https://docs.momei.app/"><strong>📚 文档站</strong></a>
</p>

> 墨梅 (Momei) - 专为技术开发者和跨境内容创作者量身定制的专业、高性能、国际化博客平台。

## 📖 简介

墨梅 (Momei) 是一个基于 **Nuxt 3** 构建的现代化博客平台。它旨在解决传统博客平台在国际化、迁移成本和现代化技术栈支持方面的痛点。无论你是希望拥有完全控制权的开发者，还是面向全球读者的技术作者，墨梅都能为你提供无冗余的高效创作体验。

## ✨ 核心特性

-   **现代化技术栈**: 基于 Nuxt 3 (Vue 3 + TypeScript) 构建，支持 SSG/SSR 混合渲染，性能卓越。
-   **原生国际化 (i18n)**: 内置多语言支持，从 UI 到内容管理的深度集成，助你轻松触达全球读者。
-   **平滑迁移**: 支持自定义 URL Slug (路径别名)，确保从旧博客迁移时 SEO 零损失。
-   **Markdown 创作**: 简洁高效的 Markdown 编辑器，支持实时预览和图片拖拽上传。
-   **AI 辅助 (规划中)**: 集成 AI 标题生成、内容翻译和润色功能，提升创作效率。
-   **多端支持 (规划中)**: 未来将支持 Tauri 桌面端应用，实现离线写作与云端同步。

## 🏠 在线体验

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

-   **核心框架**: [Nuxt 3](https://nuxt.com/)
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

## 📚 文档

详细的开发和设计文档请访问：[**墨梅博客文档站**](https://docs.momei.app/)

主要章节：

-   [**快速开始**](https://docs.momei.app/guide/quick-start) - 一键部署与启动
-   [**方案对比**](https://docs.momei.app/plan/comparison) - 为什么选择墨梅?
-   [**部署指南**](https://docs.momei.app/guide/deploy) - Vercel/Docker/私有服务器
-   [**开发指南**](https://docs.momei.app/guide/setup) - 环境搭建与贡献
-   [**API 设计**](https://docs.momei.app/design/api) - 接口规范与定义
-   [**数据库设计**](https://docs.momei.app/design/database) - 表结构与关系

## 📦 依赖要求

-   Node.js >= 20
-   PNPM (推荐)

## ☁️ 部署说明

### 支持情况

建议使用 Vercel、Netlify 或 Docker 进行部署。

点击下方按钮一键部署到 Vercel。
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCaoMeiYouRen%2Fmomei)

### 数据库支持

墨梅原生支持以下数据库：

-   **SQLite**: 默认选项，无需配置服务器，适合个人博客。
-   **MySQL / PostgreSQL**: 适合有更高数据管理需求的用户，通过 `DATABASE_URL` 进行配置。

详情请参考 [部署指南](https://docs.momei.app/guide/deploy)。

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
This project is [MIT](./LICENSE) licensed.

---

_This README was generated with ❤️ by [cmyr-template-cli](https://github.com/CaoMeiYouRen/cmyr-template-cli)_
