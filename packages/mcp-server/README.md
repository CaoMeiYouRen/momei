# Momei MCP Server

[简体中文](./README.md) | [English](./README.en-US.md)

墨梅博客的 MCP（Model Context Protocol）服务器，允许 Claude Desktop、Cursor 等支持 MCP 的 AI 客户端通过标准协议访问墨梅文章管理能力。

### 功能特性

当前服务向 AI 客户端暴露 **33 个** MCP 工具，涵盖文章管理、分类法管理、灵感碎片管理与自动化能力：

#### 文章管理

- `list_posts`：分页查询文章列表，支持状态、语言过滤和搜索。
- `get_post`：根据 ID 获取文章的完整元数据与正文。
- `create_post`：创建新文章草稿。
- `update_post`：更新文章标题、内容或标签。
- `publish_post`：将草稿或待审核文章发布上线。
- `list_post_versions`：列出指定文章的所有历史版本。
- `create_post_version`：为指定文章创建新版本快照。
- `delete_post`：删除文章，默认关闭，需显式启用危险工具开关。

#### 分类管理

- `list_categories`：分页查询分类列表，支持语言、搜索和父级过滤。
- `create_category`：创建新分类。
- `update_category`：更新已有分类的名称、别名或描述。
- `delete_category`：删除分类，默认关闭，需显式启用危险工具开关。

#### 标签管理

- `list_tags`：分页查询标签列表，支持语言和搜索过滤。
- `create_tag`：创建新标签。
- `update_tag`：更新已有标签的名称或别名。
- `delete_tag`：删除标签，默认关闭，需显式启用危险工具开关。

#### 灵感碎片管理

- `list_snippets`：分页查询灵感碎片列表，支持状态、来源和搜索过滤。
- `create_snippet`：创建新的灵感碎片。
- `get_snippet`：根据 ID 获取灵感碎片的详细信息。
- `update_snippet`：更新灵感碎片的内容、来源或状态。
- `convert_snippet_to_post`：将灵感碎片一键转换为文章草稿。
- `delete_snippet`：删除灵感碎片，默认关闭，需显式启用危险工具开关。

#### AI 自动化

- `suggest_titles`：基于文章正文生成标题建议。
- `recommend_tags`：基于文章正文与现有标签生成标签建议。
- `recommend_categories`：基于文章正文、源分类与目标语言现有 taxonomy 生成分类建议。
- `translate_post`：创建整篇翻译任务，并返回任务标识。
- `generate_cover_image`：生成封面图并在任务完成后自动回填文章封面字段。
- `generate_post_audio`：生成 TTS / 播客音频并在任务完成后自动回填文章音频字段。
- `get_ai_task`：查询自动化任务状态、进度与结果。

#### 导入与迁移工具

- `validate_import_post`：在导入前校验文章正文中的路径别名。
- `dry_run_link_governance`：预览链接治理变更而不实际应用。
- `apply_link_governance`：应用链接治理变更以重写或重定向链接。
- `get_link_governance_report`：根据报告 ID 获取链接治理报告。

其中标题建议、标签推荐、分类推荐属于同步工具；翻译、封面图、音频属于长任务工具，默认返回 `taskId` 后由客户端按需继续查询。导入验证、链接治理预览与执行提供对博客迁移场景的高效支持。

### 运行模式

`momei-mcp-server` 支持两种运行模式：

| 模式 | 传输 | 启动方式 | 适用场景 |
|------|------|---------|---------|
| **Stdio（默认）** | stdio | `node dist/index.mjs`（CLI） | Claude Desktop、Cursor 本地集成 |
| **HTTP（程序化）** | Streamable HTTP | 宿主应用调用 `createMcpHttpServer()` | 远程访问、云部署、主应用挂载 |

#### Stdio 模式（CLI）

```bash
MOMEI_API_KEY=your_key node dist/index.mjs
```

#### HTTP 模式（程序化调用）

HTTP 模式通过包导出的 `createMcpHttpServer()` 函数嵌入到宿主应用中（如 Nuxt/Nitro 插件）：

```typescript
import { createMcpHttpServer, SERVER_NAME, SERVER_VERSION } from 'momei-mcp-server'

const { transport, server, close } = await createMcpHttpServer({
    apiKey: 'your_momei_api_key',
    enableDangerousTools: false,
})

// transport.handleRequest(request) → Response 用于路由分发
// await close() 用于优雅关闭
```

墨梅主应用已内置 MCP HTTP 挂载：设置 `MOMEI_ENABLE_MCP_HTTP=true` 后，`/api/mcp` 端点自动可用。

### 安装与构建

```bash
cd packages/mcp-server
pnpm install
pnpm build
```

构建产物入口为 `dist/index.mjs`。包含所有导出（`createMcpHttpServer`、工具注册函数、类型定义）。

### 配置

通过环境变量配置：

| 环境变量 | 说明 | 默认值 |
| --- | --- | --- |
| `MOMEI_API_URL` | 墨梅主应用 API 地址 | `http://localhost:3000` |
| `MOMEI_API_KEY` | 墨梅 Open API Key | 必填 |
| `MOMEI_ENABLE_DANGEROUS_TOOLS` | 是否启用危险工具，例如删除文章 | `false` |

### Claude Desktop 集成

编辑 `claude_desktop_config.json`：

- macOS：`~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows：`%APPDATA%\Claude\claude_desktop_config.json`

示例配置：

```json
{
  "mcpServers": {
    "momei": {
      "command": "node",
      "args": ["D:/Projects/typescript-projects/momei/packages/mcp-server/dist/index.mjs"],
      "env": {
        "MOMEI_API_URL": "http://localhost:3000",
        "MOMEI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

请将路径替换为你本机上的实际绝对路径。

### Cursor 集成

1. 打开 Cursor 设置 `Ctrl + Shift + J`，进入 Features -> MCP。
2. 点击 `+ Add MCP Server`。
3. 名称可设为 `momei`，类型选择 `command`。
4. 命令示例：

```bash
node "D:/Projects/typescript-projects/momei/packages/mcp-server/dist/index.mjs"
```

5. 在对应配置中添加环境变量：
   - `MOMEI_API_URL`
   - `MOMEI_API_KEY`

也可以参考仓库根目录中的 `mcp.json.example`。

### 性能与测试

项目保留了基准测试与压力测试能力，用于评估包装层开销和远端 API 稳定性。

基准测试脚本：

```bash
pnpm test:bench
```

压力测试示例：

```bash
pnpm run stress-test -- -u http://localhost:3000 -k YOUR_API_KEY -n 1000 -c 10
```

参数说明：

- `-u`：API 地址
- `-k`：API Key，必填
- `-n`：总请求量
- `-c`：并发数
- `-t`：测试类型，`list` 或 `get`

### 安全建议

1. API Key 只授予必要权限。
2. 默认不要开启危险工具，尤其是删除能力。
3. 对长任务工具配合 `get_ai_task` 与主应用审计日志跟踪回填结果。
4. 不要把 MCP 工具当作高并发批处理入口；批量自动化优先使用 CLI 或直接调外部 API。
5. `translate_post` 支持 `confirmationMode=require|confirmed`，可先拿到预览结果，再由上层代理决定是否应用。

### 程序化导出

| 导出名 | 类型 | 说明 |
|--------|------|------|
| `createMcpHttpServer(options)` | async function | 创建 McpServer + HTTP Transport，返回 `{ transport, server, close }` |
| `McpTransport` | interface | `{ handleRequest(request, options?) → Promise<Response> }` |
| `McpHttpServer` | interface | `{ transport, server, close() }` |
| `SERVER_NAME` | `'momei-blog'` | 服务器名称常量 |
| `SERVER_VERSION` | `'1.0.0'` | 服务器版本常量 |
| `registerPostTools(server, config)` | function | 注册文章管理工具集 |
| `registerTaxonomyTools(server, config)` | function | 注册分类/标签管理工具集 |
| `registerSnippetTools(server, config)` | function | 注册灵感碎片管理工具集 |
| `registerAutomationTools(server, config)` | function | 注册 AI 自动化工具集 |
| `loadConfig()` | function | 从环境变量加载 `MomeiApiConfig` |

### 开发

MCP 基于 stdio 通信，调试时不要使用 `console.log`，应改用 `console.error`，避免污染协议输出。

```bash
pnpm dev
pnpm test
pnpm lint
pnpm typecheck
```

### 许可证

MIT
