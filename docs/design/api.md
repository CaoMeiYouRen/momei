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

### 4.2 Users & Admin (用户与管理)

大部分用户管理功能由 `better-auth` 及其 Admin 插件直接提供，无需重复开发业务逻辑，仅需在前端调用相应 SDK 方法即可。

#### 4.2.1 Admin 接口 (基于 better-auth admin plugin)

详见：[better-auth Admin Plugin Docs](https://www.better-auth.com/docs/plugins/admin)

-   **用户列表与查询**: `authClient.admin.listUsers`
    -   支持查询、过滤（`searchValue`, `filterField`）、排序（`sortBy`, `sortDirection`）及分页（`limit`, `offset`）。
-   **角色管理**: `authClient.admin.setRole`
    -   用于调整用户权限：`admin`, `author`, `user`。
-   **账号封禁**: `authClient.admin.banUser` / `unbanUser`
    -   支持指定封禁原因（`banReason`）及过期时间（`banExpiresIn`）。
-   **账号操作**:
    -   **修改密码**: `authClient.admin.setUserPassword` - 强制重置用户密码。
    -   **信息更新**: `authClient.admin.updateUser` - 修改用户昵称、头像等。
    -   **删除用户**: `authClient.admin.removeUser` - 彻底删除账号。
-   **会话监控**:
    -   **列表会话**: `authClient.admin.listUserSessions` - 查看用户当前在线设备。
    -   **吊销会话**: `authClient.admin.revokeUserSession(s)` - 强制踢出登录。
-   **性能测试与调试 (Impersonation)**:
    -   `authClient.admin.impersonateUser` - 以目标用户身份登录（用于排查问题）。

#### 4.2.2 基础用户接口 (用户自运营)

-   `POST /api/user/avatar`: 自定义头像上传接口（由后端处理存储并回填 `better-auth` 的 `image` 字段）。
-   `UPDATE /api/user/profile`: 用户修改个人信息（底层转发至 `auth.api.updateUser`）。

### 4.3 Posts (文章管理)

#### Public & Management APIs (公开与管理接口)

-   `GET /api/posts`

    -   **Query**:
        -   `page`: 页码 (default: 1)
        -   `limit`: 每页数量 (default: 10)
        -   `scope`: 作用域 `public` (默认) | `manage`
        -   `status`: 状态筛选 (仅 `scope=manage` 时有效)
        -   `tag`: 标签筛选
        -   `category`: 分类筛选
        -   `authorId`: 作者筛选
        -   `search`: 关键词搜索 (标题/摘要)
    -   **Logic**:
        -   **Public Mode** (`scope=public`): 仅返回 `status=published` 的文章。
        -   **Manage Mode** (`scope=manage`): 需 Auth (`admin` 或 `author`)。
            -   `author`: 只能查看自己的文章。
            -   `admin`: 可查看所有，支持 `authorId` 筛选。
            -   支持 `status` 筛选 (published, draft, pending)。
    -   **Response**: `ApiResponse<{ list: Post[]; total: number; page: number }>` — 返回数据包裹在统一响应结构中。

-   `GET /api/posts/:id`

    -   **Response**: `ApiResponse<Post>` — 返回文章详情（包裹在统一响应结构内）。
    -   **Note**: 通过 ID 获取。通常用于管理端或预览。

-   `GET /api/posts/slug/:slug`
    -   **Response**: 文章详情。
    -   **Note**: 通过 Slug 获取。用于公开展示。增加阅读量计数 (PV) (Post-MVP 实现)。
-   `GET /api/posts/archive`

    -   **Query**:
        -   `year` (optional) 年（例如 2024），用于筛选单年归档。
        -   `month` (optional) 月（1-12），用于筛选单月归档（需 `year`）。
        -   `language` (optional) 语言代码（`zh`/`en`），用于国际化过滤。
        -   `includePosts` (optional, boolean, default: false) 是否返回当月的文章列表（false 时仅返回年月与计数）。
        -   `page`, `limit` (当 `includePosts=true` 时生效，用于分页文章列表)。
    -   **Logic**:
        -   返回按年/月聚合的归档树（降序）。`scope=public` 默认仅包含已发布文章。
        -   对大站点默认仅返回年月与计数；当需要文章列表时，建议分页请求以避免一次性拉取大量内容。
    -   **Response**: `ApiResponse<{ list: Array<{ year: number; months: Array<{ month: number; count: number; posts?: Post[] }>} > }>`
    -   **Response Example**:
        -   ```json
            {
                "code": 200,
                "message": "Success",
                "data": {
                    "list": [
                        {
                            "year": 2025,
                            "months": [
                                {
                                    "month": 12,
                                    "count": 5,
                                    "posts": [
                                        {
                                            "id": "...",
                                            "title": "...",
                                            "slug": "...",
                                            "publishedAt": "...",
                                            "summary": "..."
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            }
            ```
    -   **Notes**:
        -   建议对 `publishedAt` 建索引以提升聚合查询性能。
        -   支持缓存头（Cache-Control）和后端短期缓存（例如 60s）。
        -   `scope=manage` 时需要管理员或作者权限以查看草稿/待审核文章。

#### Write APIs (写入接口 - 需 Auth)

-   `POST /api/posts`

    -   **Body**: `{ title, content, slug?, summary?, coverImage?, categoryId?, tags?: string[], status? }`
    -   **Note**: 创建新文章。

-   `PUT /api/posts/:id`

    -   **Body**: 同 POST (部分更新)。
    -   **Note**: 更新文章。

-   `DELETE /api/posts/:id`

    -   **Note**: 软删除或物理删除。

-   `PUT /api/posts/:id/status`
    -   **Body**: `{ status: 'published' | 'draft' | 'pending' }`
    -   **Note**: 快速修改状态 (如审核通过)。

### 4.4 Categories (分类管理)

-   `GET /api/categories`

    -   **Query**:
        -   `page`, `limit`
        -   `search`: 搜索名称
    -   **Response**: `ApiResponse<{ list: Category[]; total?: number }>` — 分类列表 (支持树形结构返回或平铺)。

-   `GET /api/categories/:id` (或 `/api/categories/slug/:slug`)

    -   **Response**: `ApiResponse<Category>` — 分类详情。

-   `POST /api/categories` (Auth: Admin)

    -   **Body**: `{ name, slug, description?, parentId? }`
    -   **Note**: 创建分类。

-   `PUT /api/categories/:id` (Auth: Admin)

    -   **Body**: 同 POST (部分更新)。

-   `DELETE /api/categories/:id` (Auth: Admin)
    -   **Note**: 删除分类 (需检查是否有关联文章，策略：拒绝删除或转移文章)。

### 4.5 Tags (标签管理)

-   `GET /api/tags`

    -   **Query**: `page`, `limit`, `search`
    -   **Response**: `ApiResponse<{ list: Tag[]; total?: number }>` — 标签列表。

-   `GET /api/tags/:id` (或 `/api/tags/slug/:slug`)

    -   **Response**: `ApiResponse<Tag>` — 标签详情。

-   `POST /api/tags` (Auth: Admin, Author)

    -   **Body**: `{ name, slug }`
    -   **Note**: 创建标签 (Author 在写文章时可创建)。

-   `PUT /api/tags/:id` (Auth: Admin)

    -   **Body**: `{ name, slug }`

-   `DELETE /api/tags/:id` (Auth: Admin)
    -   **Note**: 删除标签 (解除与文章的关联)。

### 4.6 Upload

-   `POST /api/upload`: 文件上传 (支持本地存储或 S3)。

## 4.7 External APIs (外部接口)

供外部系统调用的 API，使用 API KEY 进行鉴权。

-   **鉴权方式**: Header 中携带 `X-API-KEY`。
-   **权限控制**: 目前仅支持用户级别权限，API KEY 与具体用户绑定。

#### Write APIs (写入接口)

-   `POST /api/external/posts`
    -   **Auth**: API KEY
    -   **Body**: `{ title, content, slug?, summary?, coverImage?, categoryId?, tags?: string[], status? }`
    -   **Logic**:
        -   校验 API KEY 合法性并获取对应用户。
        -   创建文章，作者为 API KEY 对应的用户。
        -   默认状态根据用户角色决定（如作者创建需审核，管理员直接发布）。
    -   **Response**: `ApiResponse<Post>`

## 5. 邮件服务配置 (Email Service Configuration)

使用 **Nodemailer** 发送事务性邮件。

-   **场景**: 注册验证、密码重置、评论通知。

## 6. 相关文档

-   [API 规范](../standards/api.md)
-   [UI 设计](./ui.md)
-   [项目计划](../plan/roadmap.md)
