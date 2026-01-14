# 墨梅 (Momei) 后端接口设计文档

## 1. 概述 (Overview)

本文档描述了墨梅博客的后端架构与 API 设计。后端旨在构建一个安全、高效、易于扩展且支持多环境部署的服务。

### 1.1 技术栈 (Tech Stack)

-   **框架**: Nuxt 3 Server Engine (Nitro)
-   **认证与权限**: [better-auth](https://github.com/better-auth/better-auth)
-   **数据库 ORM**: [TypeORM](https://typeorm.io/)
-   **数据库支持**: PostgreSQL (推荐), MySQL, SQLite (开发/轻量级)
-   **参数校验**: [Zod](https://zod.dev/)
-   **邮件服务**: [Nodemailer](https://nodemailer.com/)
-   **部署目标**: Node.js, Docker, Vercel, Cloudflare Workers (需注意数据库连接适配)

## 2. 认证与权限设计 (Authentication & Authorization Design)

采用 **better-auth** 进行全栈认证管理。
相关文档（需要时必须读取）：https://www.better-auth.com/llms.txt

-   **认证方式**: 支持 Email/Password, OAuth (GitHub, Google 等)。
-   **权限控制**: 基于角色的访问控制 (RBAC)。
    -   `admin`: 系统管理员，拥有所有权限，可审核文章。
    -   `author`：普通作者，可提交和管理自己的文章，和自己文章下的评论。
    -   `user`: 普通注册用户，仅浏览和评论。
    -   `visitor`: 访客，仅浏览（匿名用户）。

## 3. 数据库设计 (Database Design)

使用 **TypeORM** 作为 ORM 层，支持多数据库切换。

### 3.1 实体 (Entities) - 核心规划

-   **User**: 用户信息 (集成 better-auth 表结构)。
-   **Post**: 文章 (Title, Content, Slug, Status, Author, Lang)。
-   **Tag/Category**: 分类与标签。
-   **Comment**: 评论。
-   **Setting**: 系统设置 (KV 存储)。

### 3.2 数据库适配

-   **开发环境**: 默认使用 SQLite (`better-sqlite3`)，无需额外配置。
-   **生产环境**: 推荐 PostgreSQL。
-   **Serverless**: 针对 Vercel/Cloudflare Workers，需配置连接池或使用 HTTP 代理 (如 Neon, PlanetScale)。

## 4. 接口与路由规划 (APIs & Routes)

具体的 API 定义已按功能模块拆分，请阅读以下文档：

-   **博客模块**: [docs/design/modules/blog.md](./modules/blog.md)
-   **搜索模块**: [docs/design/modules/search.md](./modules/search.md)
-   **用户模块**: [docs/design/modules/user.md](./modules/user.md)
-   **管理模块**: [docs/design/modules/admin.md](./modules/admin.md)
-   **开放平台**: [docs/design/modules/open-api.md](./modules/open-api.md)

-   **[认证 (Auth)](./modules/auth.md)**: 登录、注册、Logout.
-   **[用户 (User)](./modules/user.md)**: Profile, Avatar.
-   **[博客 (Blog)](./modules/blog.md)**: Posts, Archives (Public).
-   **[管理 (Admin)](./modules/admin.md)**: Admin APIs for User/Content.
-   **[系统 (System)](./modules/system.md)**: Uploads, External APIs.- **[AI 辅助 (AI)](./modules/ai.md)**: AI Content Assistant.

## 5. 国际化路由与 Slug 设计

### 5.1 唯一性冲突优化

-   **联合唯一索引**: 为了支持不同语言使用相同的 Slug（例如 `/about` 和 `/en-US/about`），数据库 `Post`, `Category`, `Tag` 实体的 `slug` 唯一约束应调整为 `(slug, language)` 联合唯一。
-   **SEO 友好**: 允许不同语言版本拥有各自翻译后的 Slug，提高搜索引擎在特定语言环境下的抓取权重。

### 5.2 关联逻辑

-   **Translation Cluster**: 具有相同 `translationId` 的实体组成一个“翻译簇”。
    -   _关联标识优化_: 建议后续研究将 `translationId` 优化为复用原始版本的 `slug`，以增强语义化表达。
-   **平滑切换**: 语言切换组件在检测到当前为详情页时，应通过 `translationId` 查询目标语言实体的 `slug`，实现“原文 <-> 译文”的精确跳转，而非简单回退到首页。

## 6. 邮件服务配置 (Email Service Configuration)

使用 **Nodemailer** 发送事务性邮件。

-   **场景**: 注册验证、密码重置、评论通知。

## 7. 相关文档

-   [API 规范](../standards/api.md)
-   [开发规范](../standards/development.md)
