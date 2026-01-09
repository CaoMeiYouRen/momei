# 开放平台 API (OpenAPI)

## 1. 概述 (Overview)

本模块包含面向第三方开发者和工具的开放 API，允许通过 API Key 进行身份验证并执行操作（如发布文章、上传资源等）。

## 2. 鉴权机制 (Authentication)

### 2.1 API Key

所有 OpenAPI 请求必须携带 API Key。

-   **Header**:
    -   `X-API-KEY: momei_sk_...`
    -   或者 `Authorization: Bearer momei_sk_...`

### 2.2 错误码

-   `401 Unauthorized`: API Key 无效、过期或未提供。
-   `403 Forbidden`: 此 API Key 没有执行该操作的权限。

## 3. 接口列表 (Endpoints)

### 3.1 外部发布文章 (Publish Post)

> 参见 [TODO List](../../plan/todo.md) 中的 "外部发布 API" 章节。

专门用于第三方工具（如 Obsidian, VSCode 插件, CI/CD 脚本）发布文章。

#### `POST /api/external/posts`

-   **请求体 (Body)**:
    ```json
    {
        "title": "文章标题",
        "content": "Markdown 内容",
        "slug": "custom-slug", // (可选)
        "tags": ["Tag1", "Tag2"], // (可选) 自动创建不存在的标签
        "categoryId": "cid_...", // (可选)
        "language": "zh", // (可选) 默认 zh
        "status": "published", // (可选) 默认为 pending, 除非 api key 用户是 admin/author 且策略允许
        "coverImage": "https://..." // (可选)
    }
    ```
-   **响应 (Response)**:
    ```json
    {
        "code": 200,
        "data": {
            "id": "post_...",
            "url": "https://domain.com/posts/custom-slug"
        }
    }
    ```

## 4. 管理接口 (Management APIs)

API Key 的管理功能（创建/撤销）通常集成在用户个人设置中。

#### API Key 管理 (User Scope)

-   `GET /api/user/api-keys`: 列出我的 API Keys
-   `POST /api/user/api-keys`: 创建新的 API Key
    -   Return: `{ key: "momei_sk_xxxx" }` (Only show once)
-   `DELETE /api/user/api-keys/:id`: 撤销 API Key
