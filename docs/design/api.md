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
    -   `admin`: 系统管理员，拥有所有权限。
    -   `author`：普通作者，可管理自己的文章，和自己文章下的评论。
    -   `user`: 普通注册用户，可管理自己的评论。
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

### 4.2 Posts

-   `GET /api/posts`: 获取文章列表 (分页, 筛选)。
-   `GET /api/posts/:id`: 获取文章详情。
-   `POST /api/posts`: 创建文章 (需 Auth)。
-   `PUT /api/posts/:id`: 更新文章 (需 Auth)。
-   `DELETE /api/posts/:id`: 删除文章 (需 Auth)。

### 4.3 Upload

-   `POST /api/upload`: 文件上传 (支持本地存储或 S3)。

## 5. 邮件服务配置 (Email Service Configuration)

使用 **Nodemailer** 发送事务性邮件。

-   **场景**: 注册验证、密码重置、评论通知。

## 6. 相关文档

-   [API 规范](../standards/api.md)
-   [UI 设计](./ui.md)
-   [项目计划](../plan/roadmap.md)
