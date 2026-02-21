# MCP 服务器 (MCP Server)

## 1. 概述 (Overview)

MCP (Model Context Protocol) 服务器允许 AI 客户端（如 Claude Desktop, Cursor）通过标准化协议与墨梅博客进行交互，实现 AI 驱动的自动化博客管理与创作。

### 1.1 设计目标

- **零代码迁移**: 基于现有 pnpm workspace 架构，作为独立包 `packages/mcp-server` 存在。
- **协议驱动**: 完全遵循 Anthropic MCP 规范。
- **环境适配**: 已验证在本地、Docker 及多种 AI 编辑器（Cursor/Claude）中的兼容性。

## 2. 核心功能 (Tools & Resources)

### 2.1 核心工具 (Tools)

| 工具名称 | 功能描述 | 参数 |
| :--- | :--- | :--- |
| `list_posts` | 列出文章列表 | status?, language?, limit? |
| `get_post` | 获取文章详情 | id 或 slug |
| `create_post` | 创建新文章草稿 | title, content, tags[] |
| `update_post` | 更新现有文章 | id, title?, content?, status? |
| `publish_post` | 发布文章（草稿 -> 已发布） | id |
| `upload_image` | 上传图片 | imageData (base64) |
| `delete_post` | 删除文章 (受限功能) | id |

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
