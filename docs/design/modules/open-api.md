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

当前已落地的最小能力是 `POST /api/external/posts`。若后续需要继续扩展迁移治理、批量导入或自动化链路，请以 [项目计划](../../plan/roadmap.md) 和 [迁移链接治理与云端资源重写](./migration-link-governance.md) 为准。

专门用于第三方工具（如 Obsidian, VSCode 插件, CI/CD 脚本）发布文章。

#### `POST /api/external/posts`

-   **请求体 (Body)**:
    ```json
    {
        "title": "文章标题",
        "content": "Markdown 内容",
        "slug": "custom-slug", // (可选)
        "abbrlink": "legacy-short-slug", // (可选) 仅导入场景使用
        "permalink": "/2024/03/custom-slug/", // (可选) 仅导入场景使用
        "sourceFile": "posts/custom-slug.md", // (可选) 仅导入场景使用
        "confirmPathAliases": false, // (可选) 是否确认 fallback / repair 结果
        "tags": ["Tag1", "Tag2"], // (可选) 自动创建不存在的标签
        "categoryId": "cid_...", // (可选)
        "language": "zh-CN", // (可选) 默认 zh-CN
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

#### `POST /api/external/posts/validate`

-   **用途**: 在真正创建文章前，对 `slug`、`abbrlink`、`permalink` 执行格式、保留字、语言内冲突和 fallback / repair 审计。
-   **典型场景**: CLI 批量迁移、第三方导入器 dry-run、需要人工确认路径别名修复的自动化脚本。
-   **响应 (Response)**:
    ```json
    {
        "code": 200,
        "data": {
            "language": "zh-CN",
            "canonicalSlug": "custom-slug",
            "canonicalSource": "slug",
            "canImport": true,
            "requiresConfirmation": false,
            "hasBlockingIssues": false,
            "summary": {
                "accepted": 2,
                "fallback": 0,
                "repaired": 0,
                "invalid": 0,
                "conflict": 0,
                "needs-confirmation": 0,
                "skipped": 0
            },
            "items": []
        }
    }
    ```

补充说明：

-   `POST /api/external/posts` 现在会复用同一套校验逻辑；若存在 fallback / repair / 保留路径冲突但未显式确认，将返回 `409`，避免静默导入不可用路径。
-   `permalink` 不再作为 canonical slug 直接写入文章，而是作为历史路径别名输入参与导入前审计与后续链接治理。

### 3.2 迁移链接治理 (规划中)

第十一阶段已冻结迁移链接治理的最小能力矩阵，但接口尚未落地实现。后续 Open API 将按 `dry-run / apply / report` 三类入口扩展，统一复用 API Key 鉴权，并以 [迁移链接治理与云端资源重写](./migration-link-governance.md) 作为契约事实源。

## 4. 管理接口 (Management APIs)

API Key 的管理功能（创建/撤销）通常集成在用户个人设置中。

#### API Key 管理 (User Scope)

-   `GET /api/user/api-keys`: 列出我的 API Keys
-   `POST /api/user/api-keys`: 创建新的 API Key
    -   Return: `{ key: "momei_sk_xxxx" }` (Only show once)
-   `DELETE /api/user/api-keys/:id`: 撤销 API Key
