# MCP 服务器 (MCP Server)

## 1. 概述 (Overview)

MCP (Model Context Protocol) 服务器允许 AI 客户端（如 Claude Desktop, Cursor）通过标准化协议与墨梅博客进行交互，实现 AI 驱动的自动化博客管理与创作。

### 1.1 设计目标

- **零代码迁移**: 基于现有 pnpm workspace 架构，作为独立包 `packages/mcp-server` 存在。
- **协议驱动**: 完全遵循 Anthropic MCP 规范。
- **环境适配**: 已验证在本地、Docker 及多种 AI 编辑器（Cursor/Claude）中的兼容性。

## 2. 核心功能 (Tools & Resources)

### 2.1 核心工具 (Tools)

MCP 服务器当前提供 **33 个工具**，分为以下功能组：

#### 文章管理 (Post Management) — 8 个工具

| 工具名称 | 功能描述 | 参数 |
| :--- | :--- | :--- |
| `list_posts` | 列出文章列表 | status?, language?, limit? |
| `get_post` | 获取文章详情 | id 或 slug |
| `create_post` | 创建新文章草稿 | title, content, tags[] |
| `update_post` | 更新现有文章 | id, title?, content?, status? |
| `publish_post` | 发布文章（草稿 → 已发布） | id |
| `upload_image` | 上传图片 | imageData (base64) |
| `delete_post` | 删除文章 (受限功能) | id |
| `list_post_versions` | 列出文章版本历史 | id |
| `create_post_version` | 创建文章版本快照 | id, title?, content? |

#### 分类管理 (Category Management) — 4 个工具

| 工具名称 | 功能描述 | 参数 |
| :--- | :--- | :--- |
| `list_categories` | 列出所有分类 | language?, limit? |
| `create_category` | 创建新分类 | name, slug, language? |
| `update_category` | 更新分类 | id, name?, slug? |
| `delete_category` | 删除分类 | id |

#### 标签管理 (Tag Management) — 4 个工具

| 工具名称 | 功能描述 | 参数 |
| :--- | :--- | :--- |
| `list_tags` | 列出所有标签 | language?, limit? |
| `create_tag` | 创建新标签 | name, slug, language? |
| `update_tag` | 更新标签 | id, name?, slug? |
| `delete_tag` | 删除标签 | id |

#### 灵感片段管理 (Snippet Management) — 6 个工具

| 工具名称 | 功能描述 | 参数 |
| :--- | :--- | :--- |
| `list_snippets` | 列出灵感片段 | language?, limit? |
| `create_snippet` | 创建灵感片段 | title, content, language? |
| `get_snippet` | 获取灵感片段详情 | id |
| `update_snippet` | 更新灵感片段 | id, title?, content? |
| `delete_snippet` | 删除灵感片段 | id |
| `convert_snippet_to_post` | 将灵感片段转为文章草稿 | id, title? |

#### AI 自动化 (AI Automation) — 7 个工具

| 工具名称 | 功能描述 | 参数 |
| :--- | :--- | :--- |
| `import_post` | 导入外部文章并创建草稿 | title, content, format? |
| `import_post_validate` | 导入前置校验 | title, content |
| `generate_social_post` | 生成社交平台帖子 | content, platform |
| `review_post_quality` | 文章质量审查 | id |
| `export_hexo` | 导出 Hexo 格式 | id, format? |
| `create_content_calendar_item` | 创建内容日历条目 | title, scheduledAt |
| `generate_image` | AI 生成配图 | prompt, style? |

#### 导入与治理 (Import & Governance) — 4 个工具

| 工具名称 | 功能描述 | 参数 |
| :--- | :--- | :--- |
| `validate_import_post` | 文章导入前置校验 | title, content |
| `dry_run_link_governance` | 链接治理预演 | id |
| `apply_link_governance` | 执行链接治理 | id, action |
| `get_link_governance_report` | 获取治理报告 | id |

### 2.2 资源 (Resources)
- `momei://posts`: 获取实时文章列表。
- `momei://stats`: 获取博客统计概览。

## 3. 安全架构 (Security)

- **API Key 校验**: MCP 服务器通过 `X-API-Key` 与主应用后端 `/api/external/*` 接口通信。
- **危险操作限制**: 破坏性操作（如 `delete_post`）必须通过环境变量 `MOMEI_ENABLE_DANGEROUS_TOOLS=true` 显式开启。
- **单向隔离**: MCP 仅作为主应用的“智能代理”，无法直接绕过数据库权限执行操作。

## 4. 生产验证 (Production Validation)

- **性能验证**: 针对大批量文章（100+）检索进行了分页优化。
- **编辑器适配**:
    - **Cursor**: 通过 `.cursorrules` 优化了 AI 对 MCP 工具的调用偏好。
    - **Claude Desktop**: 支持稳定的 stdio 通信模式。

---
> 关联包: `packages/mcp-server/`
