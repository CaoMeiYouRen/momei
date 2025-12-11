# 墨梅 (Momei) 后端接口设计文档

## 1. 概述 (Overview)

本文档描述了墨梅博客平台的后端架构与 API 设计规范。后端旨在构建一个安全、高效、易于扩展且支持多环境部署的服务。

### 1.1 技术栈 (Tech Stack)

-   **框架**: Nuxt 3 Server Engine (Nitro)
-   **认证与权限**: [better-auth](https://github.com/better-auth/better-auth)
-   **数据库 ORM**: [TypeORM](https://typeorm.io/)
-   **数据库支持**: PostgreSQL (推荐), MySQL, SQLite (开发/轻量级)
-   **参数校验**: [Zod](https://zod.dev/)
-   **邮件服务**: [Nodemailer](https://nodemailer.com/)
-   **部署目标**: Node.js, Docker, Vercel, Cloudflare Workers (需注意数据库连接适配)

## 2. 统一响应格式 (Unified Response Format)

所有 API 接口（除特定流式接口或文件下载外）必须遵循统一的 JSON 响应格式。

```typescript
interface ApiResponse<T = any> {
    code: number; // 业务状态码，200 表示成功，非 200 表示异常
    message: string; // 状态描述或错误信息
    data?: T; // 成功时返回的数据
}
```

### 2.1 状态码定义 (Status Codes)

| Code | Description                            |
| :--- | :------------------------------------- |
| 200  | 成功 (Success)                         |
| 400  | 请求参数错误 (Bad Request)             |
| 401  | 未授权 (Unauthorized)                  |
| 403  | 禁止访问 (Forbidden)                   |
| 404  | 资源未找到 (Not Found)                 |
| 500  | 服务器内部错误 (Internal Server Error) |

## 3. 认证与权限 (Authentication & Authorization)

采用 **better-auth** 进行全栈认证管理。

-   **认证方式**: 支持 Email/Password, OAuth (GitHub, Google 等)。
-   **Session 管理**: 基于 Cookie 的 Session 机制，适配 SSR。
-   **权限控制**: 基于角色的访问控制 (RBAC)。
    -   `admin`: 系统管理员，拥有所有权限。
    -   `author`：普通作者，可管理自己的文章。
    -   `user`: 普通注册用户，可管理自己的评论。
    -   `visitor`: 访客，仅浏览（匿名用户）。

## 4. 数据库设计 (Database Design)

使用 **TypeORM** 作为 ORM 层，支持多数据库切换。

### 4.1 实体 (Entities) - 核心规划

-   **User**: 用户信息 (集成 better-auth 表结构)。
-   **Post**: 文章 (Title, Content, Slug, Status, Author, Lang)。
-   **Tag/Category**: 分类与标签。
-   **Comment**: 评论。
-   **Setting**: 系统设置 (KV 存储)。

### 4.2 数据库适配

-   **开发环境**: 默认使用 SQLite (`better-sqlite3`)，无需额外配置。
-   **生产环境**: 推荐 PostgreSQL。
-   **Serverless**: 针对 Vercel/Cloudflare Workers，需配置连接池或使用 HTTP 代理 (如 Neon, PlanetScale)。

## 5. 接口规范 (API Specifications)

### 5.1 参数校验 (Validation)

所有输入参数（Query, Body, Params）必须使用 **Zod** schema 进行定义和校验。

```typescript
// 示例：创建文章校验
const createPostSchema = z.object({
    title: z.string().min(1).max(100),
    content: z.string().min(1),
    slug: z
        .string()
        .regex(/^[a-z0-9-]+$/)
        .optional(),
});
```

### 5.2 路由规划 (Route Planning)

API 路由位于 `server/api` 目录下。

#### Auth

-   `POST /api/auth/*`: better-auth 处理的所有认证路由。

#### Posts

-   `GET /api/posts`: 获取文章列表 (分页, 筛选)。
-   `GET /api/posts/:id`: 获取文章详情。
-   `POST /api/posts`: 创建文章 (需 Auth)。
-   `PUT /api/posts/:id`: 更新文章 (需 Auth)。
-   `DELETE /api/posts/:id`: 删除文章 (需 Auth)。

#### Upload

-   `POST /api/upload`: 文件上传 (支持本地存储或 S3)。

## 6. 邮件服务 (Email Service)

使用 **Nodemailer** 发送事务性邮件。

-   **场景**: 注册验证、密码重置、评论通知。
-   **配置**: 通过环境变量配置 SMTP 服务商 (如 SendGrid, Resend, 或企业邮箱)。
-   **模板**: 支持 HTML 邮件模板。

## 7. 部署注意事项 (Deployment)

-   **Docker**: 提供 `Dockerfile`，构建最小化镜像。
-   **Vercel**: 确保 API 路由适配 Serverless Function 限制 (执行时间)。
-   **Cloudflare Workers**: 需注意 Node.js 兼容性标志 (`nodejs_compat`) 和数据库驱动的选择。
