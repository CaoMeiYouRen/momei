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

当前已落地的最小能力是 `POST /api/external/posts`。若后续需要继续扩展迁移治理、批量导入或自动化链路，请以 [项目计划](../../plan/roadmap.md) 和 [迁移链接治理与云端资源重写](../governance/migration-link-governance.md) 为准。

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

### 3.2 迁移链接治理 (Migration Link Governance)

迁移链接治理的最小 Open API 已落地，统一复用 API Key 鉴权，并以 [迁移链接治理与云端资源重写](../governance/migration-link-governance.md) 作为契约事实源。

#### `POST /api/external/migrations/link-governance/dry-run`

- **用途**: 仅预览存量资源链接与历史内链的重写结果，不会落盘。
- **请求体 (Body)**:
    ```json
    {
        "scopes": ["asset-url", "post-link"],
        "filters": {
            "domains": ["legacy.example.com"],
            "pathPrefixes": ["/assets"],
            "contentTypes": ["post"]
        },
        "options": {
            "reportFormat": "markdown",
            "validationMode": "static"
        }
    }
    ```

#### `POST /api/external/migrations/link-governance/apply`

- **用途**: 对站内受控内容执行实际改写，并生成 redirect seeds 与治理报告。
- **说明**: 必须先执行一次 `dry-run` 并将返回的 `reportId` 作为 `options.reviewedDryRunReportId` 回传，服务端会拒绝没有已审阅 dry-run 报告的 apply 请求。
- **请求体补充**:
    ```json
    {
        "scopes": ["asset-url"],
        "options": {
            "reviewedDryRunReportId": "report_...",
            "reportFormat": "markdown"
        }
    }
    ```

#### `GET /api/external/migrations/link-governance/reports/:reportId`

- **用途**: 查询指定 dry-run 或 apply 任务的完整报告，可用于导出 JSON / Markdown 结果。
- **响应摘要**:
    ```json
    {
        "code": 200,
        "data": {
            "reportId": "report_...",
            "mode": "dry-run",
            "summary": {
                "total": 3,
                "resolved": 0,
                "rewritten": 2,
                "unchanged": 0,
                "skipped": 1,
                "failed": 0,
                "needsConfirmation": 0
            },
            "items": [],
            "redirectSeeds": [],
            "markdown": "# report"
        }
    }
    ```

### 3.3 分类管理 (Categories)

#### `GET /api/external/categories`

-   **用途**: 获取分类列表，支持分页、搜索、翻译聚合。
-   **查询参数**: `language`, `search`, `parentId`, `aggregate` (布尔，聚合翻译簇), `page`, `limit`, `orderBy`, `order`
-   **响应示例**:
    ```json
    {
        "code": 200,
        "data": {
            "items": [{ "id": "cat_...", "name": "技术", "slug": "tech", "postCount": 5, "language": "zh-CN" }],
            "total": 1,
            "page": 1,
            "limit": 10,
            "totalPages": 1
        }
    }
    ```

#### `POST /api/external/categories`

-   **用途**: 创建新分类（需要 Admin 权限）。
-   **请求体 (Body)**:
    ```json
    {
        "name": "技术",
        "slug": "tech",
        "description": "技术相关文章",
        "parentId": null,
        "language": "zh-CN"
    }
    ```

#### `PUT /api/external/categories/[id]`

-   **用途**: 更新分类信息（需要 Admin 权限）。
-   **请求体**: 与 POST 类似，所有字段可选。

#### `DELETE /api/external/categories/[id]`

-   **用途**: 删除分类（需要 Admin 权限）。有关联文章或子分类时拒绝删除。

### 3.4 标签管理 (Tags)

#### `GET /api/external/tags`

-   **用途**: 获取标签列表，支持分页、搜索、翻译聚合。
-   **查询参数**: `language`, `search`, `aggregate`, `page`, `limit`, `orderBy`, `order`

#### `POST /api/external/tags`

-   **用途**: 创建新标签（需要 Admin 或 Author 权限）。
-   **请求体 (Body)**:
    ```json
    {
        "name": "Vue.js",
        "slug": "vuejs",
        "language": "zh-CN"
    }
    ```

#### `PUT /api/external/tags/[id]`

-   **用途**: 更新标签信息（需要 Admin 权限）。

#### `DELETE /api/external/tags/[id]`

-   **用途**: 删除标签（需要 Admin 权限）。自动清理多对多关联。

### 3.5 灵感碎片管理 (Snippets)

#### `GET /api/external/snippets`

-   **用途**: 获取灵感碎片列表，支持按状态/来源/内容搜索过滤。
-   **查询参数**: `status` (inbox/converted/archived), `source`, `search`, `page`, `limit`
-   **权限**: 非管理员只能看到自己的碎片。

#### `POST /api/external/snippets`

-   **用途**: 创建新灵感碎片。
-   **请求体 (Body)**:
    ```json
    {
        "content": "灵感内容...",
        "media": ["https://..."],
        "source": "web",
        "status": "inbox"
    }
    ```

#### `GET /api/external/snippets/[id]`

-   **用途**: 获取单个灵感碎片详情（包含关联文章和作者信息）。
-   **权限**: 非管理员只能访问自己的碎片。

#### `PUT /api/external/snippets/[id]`

-   **用途**: 更新灵感碎片内容或状态。不能将已转换/已归档的碎片恢复为收纳箱状态。
-   **权限**: 非管理员只能更新自己的碎片。

#### `DELETE /api/external/snippets/[id]`

-   **用途**: 删除灵感碎片。
-   **权限**: 非管理员只能删除自己的碎片。

### 3.6 灵感转文章 (Snippet Conversion)

#### `POST /api/external/snippets/[id]/convert`

-   **用途**: 将「收纳箱」状态的灵感碎片一键转换为文章草稿。转换后将自动标记碎片为 `converted` 并关联新文章。
-   **权限**: 非管理员只能转换自己的碎片。
-   **响应示例**:
    ```json
    {
        "code": 200,
        "data": {
            "postId": "post_...",
            "snippetId": "snp_...",
            "url": "https://domain.com/posts/generated-slug"
        }
    }
    ```

### 3.7 文章版本管理 (Post Versions)

#### `GET /api/external/posts/[id]/versions`

-   **用途**: 获取指定文章的所有版本历史（按序号降序排列）。
-   **权限**: 非管理员只能查看自己的文章版本。

#### `POST /api/external/posts/[id]/versions`

-   **用途**: 手动创建文章版本快照。自动检测与前一个版本的差异并记录变更字段。
-   **权限**: 非管理员只能为自己的文章创建版本。
-   **响应示例**:
    ```json
    {
        "code": 200,
        "data": {
            "created": true,
            "version": {
                "id": "ver_...",
                "sequence": 2,
                "changedFields": ["title", "content"],
                "commitSummary": "Manual edit: title, content"
            }
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
