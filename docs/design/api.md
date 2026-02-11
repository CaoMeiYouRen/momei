# 墨梅 (Momei) 后端接口设计文档

## 1. 概述 (Overview)

本文档描述了墨梅博客的后端架构与 API 设计。后端旨在构建一个安全、高效、易于扩展且支持多环境部署的服务。

### 1.1 技术栈 (Tech Stack)

-   **框架**: Nuxt Server Engine (Nitro)
-   **认证与权限**: [better-auth](https://github.com/better-auth/better-auth)
-   **数据库 ORM**: [TypeORM](https://typeorm.io/)
-   **数据库支持**: PostgreSQL (推荐), MySQL, SQLite (开发/轻量级)
-   **参数校验**: [Zod](https://zod.dev/)
-   **邮件服务**: [Nodemailer](https://nodemailer.com/)
-   **部署目标**: Node.js, Docker, Vercel, Cloudflare Workers (需注意数据库连接适配)

## 2. 认证与权限设计 (Authentication & Authorization Design)

采用 **better-auth** 进行全栈认证管理。

-   **认证方式**: 支持 Email/Password, OAuth (GitHub, Google 等)。
-   **权限控制**: 基于角色的访问控制 (RBAC)。
    -   `admin`: 系统管理员，拥有所有权限。
    -   `author`: 普通作者，可管理自己的文章与评论。
    -   `user`: 普通注册用户，仅浏览和评论。

## 3. 数据库设计 (Database Design)

使用 **TypeORM** 作为 ORM 层，支持多数据库切换。
详见 **[数据库设计文档](./database.md)**。

## 4. 接口与路由规划 (APIs & Routes)

具体的 API 定义已按功能模块拆分，请阅读对应的详细设计文档：

- **[认证系统 (Auth)](modules/auth.md)**: `/api/auth/*` (登录、注册、OAuth)。
- **[用户空间 (User)](modules/user.md)**: `/api/user/*` (资料、API Key、偏好设置)。
- **[博客内容 (Blog)](modules/blog.md)**: `/api/posts/*` (文章浏览、详情、阅读量)。
- **[分类体系 (Taxonomy)](modules/taxonomy.md)**: `/api/categories/*`, `/api/tags/*`。
- **[互动系统 (Interactions)](modules/interactions.md)**: `/api/comments/*` (评论、点赞、验证码)。
- **[管理员管理 (Admin)](modules/admin.md)**: `/api/admin/*` (系统设置、高级管理)。
- **[商业化与社交 (Commercial)](modules/commercial.md)**: `/api/settings/commercial`, `/api/user/commercial`。
- **[AI 辅助 (AI)](modules/ai.md)**: `/api/ai/*` (摘要、翻译、Slug 生成)。
- **[通知与订阅 (Notifications)](modules/notifications.md)**: `/api/subscribers/*` (订阅、退订、偏好验证码)。
- **[全局搜索 (Search)](modules/search.md)**: `/api/search/*` (全站内容搜索)。
- **[定时任务 (Tasks)](modules/scheduled-publication.md)**: `/api/tasks/*` (由于 Serverless 触发的定时任务)。
- **[安装引导 (Installation)](modules/system.md)**: `/api/install/*` (初始化环境与管理员创建)。
- **[法律合规 (Compliance)](modules/system.md)**: `/api/agreements/*` (隐私政策、用户协议获取)。
- **[代码片段 (Snippets)](modules/blog.md)**: `/api/snippets/*` (复用的页面组件/内容块)。
- **[开放平台 (Open API)](modules/open-api.md)**: `/api/external/*` (外部发布接口)。
- **[系统能力 (System)](modules/system.md)**: `/api/upload/*` (文件上传)、`/api/settings/*` (公开设置)。

## 5. 国际化路由与 Slug 设计

### 5.1 唯一性冲突优化

-   **联合唯一索引**: 数据库 `Post`, `Category`, `Tag` 实体的 `slug` 唯一约束为 `(slug, language)` 联合唯一。
-   **SEO 友好**: 允许不同语言版本拥有各自翻译后的 Slug。

### 5.2 关联逻辑

-   **Translation Cluster**: 具有相同 `translationId` 的实体组成一个“翻译簇”。
-   **平滑切换**: 语言切换组件通过 `translationId` 在不同版本间精确跳转。

## 6. 相关文档

-   [API 规范](../standards/api.md)
-   [开发规范](../standards/development.md)
