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

## 4. 路由规划 (Route Planning)

API 路由位于 `server/api` 目录下。

### 4.1 Auth

-   `POST /api/auth/*`: better-auth 处理的所有认证路由。

### 4.2 Users (Custom APIs)

大部分用户管理功能由 `better-auth` 及其 Admin 插件提供，无需重复开发。

-   **Admin 功能**: 使用 `better-auth` Admin Plugin 提供的接口。
    -   `listUsers`, `setRole`, `banUser`, `impersonateUser` 等。
-   **User 功能**:
    -   `getSession`: 获取当前用户信息。
    -   `updateUser`: 更新个人资料。

如果确有 `better-auth` 无法满足的特定业务逻辑（如复杂的头像上传处理），再考虑添加自定义接口。

### 4.3 Posts (文章管理)

#### Public APIs (公开接口)

-   `GET /api/posts`

    -   **Query**:
        -   `page`: 页码 (default: 1)
        -   `limit`: 每页数量 (default: 10)
        -   `tag`: 标签筛选
        -   `category`: 分类筛选
        -   `authorId`: 作者筛选
        -   `search`: 关键词搜索 (标题/摘要)
    -   **Response**: `{ list: Post[], total: number, page: number }`
    -   **Note**: 仅返回 `status=published` 的文章。

-   `GET /api/posts/:id` (或 `/api/posts/slug/:slug`)
    -   **Response**: 文章详情，包含 `content`, `author`, `category`, `tags`。
    -   **Note**: 增加阅读量计数 (PV)。

#### Management APIs (管理接口 - 需 Auth)

-   `GET /api/posts`

    -   **Auth**: `admin` 或 `author`。
    -   **Query**: 同 Public，额外支持 `status` 筛选。
    -   **Note**: `author` 只能看到自己的文章，`admin` 可看所有。

-   `POST /api/posts`

    -   **Body**: `{ title, content, slug?, summary?, coverImage?, categoryId?, tags?: string[], status? }`
    -   **Note**: 创建新文章。

-   `PUT /api/posts/:id`

    -   **Body**: 同 POST (部分更新)。
    -   **Note**: 更新文章。

-   `DELETE /api/posts/:id`

    -   **Note**: 软删除或物理删除。

-   `PATCH /api/posts/:id/status`
    -   **Body**: `{ status: 'published' | 'draft' | 'pending' }`
    -   **Note**: 快速修改状态 (如审核通过)。

### 4.4 Upload

-   `POST /api/upload`: 文件上传 (支持本地存储或 S3)。

## 5. 邮件服务配置 (Email Service Configuration)

使用 **Nodemailer** 发送事务性邮件。

-   **场景**: 注册验证、密码重置、评论通知。

## 6. 相关文档

-   [API 规范](../standards/api.md)
-   [UI 设计](./ui.md)
-   [项目计划](../plan/roadmap.md)
