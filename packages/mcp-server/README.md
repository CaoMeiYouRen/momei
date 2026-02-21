# Momei MCP Server

墨梅博客 MCP (Model Context Protocol) 服务器，允许 Claude Desktop 等 AI 客户端通过标准化协议与墨梅博客进行交互，实现 AI 驱动的自动化博客管理。

## 功能特性

本服务器提供了一系列工具（Tools），使 AI 助手能够：

- **列表查询 (`list_posts`)**: 分页查询文章列表，支持状态、语言过滤及搜索。
- **获取详情 (`get_post`)**: 根据 ID 获取文章的完整元数据与内容。
- **创建草稿 (`create_post`)**: 快速创建新文章草稿。
- **更新文章 (`update_post`)**: 修改现有文章的内容、标题或标签。
- **发布文章 (`publish_post`)**: 将文章状态从草稿或待审核更改为已发布。
- **删除文章 (`delete_post`)**: 移除文章（需显式开启危险工具开关）。

## 安装与构建

### 从源码构建

在项目根目录下或 `packages/mcp-server` 目录下执行：

```bash
cd packages/mcp-server
pnpm install
pnpm build
```

构建完成后，入口文件位于 `dist/index.mjs`。

## 配置

MCP 服务器通过环境变量进行配置：

| 环境变量 | 说明 | 默认值 |
|----------|------|--------|
| `MOMEI_API_URL` | 墨梅博客主应用的 API 地址 | `http://localhost:3000` |
| `MOMEI_API_KEY` | 墨梅博客的 Open API Key (可在后台生成) | (必需) |
| `MOMEI_ENABLE_DANGEROUS_TOOLS` | 是否启用危险工具（如删除文章）。设为 `true` 以启用 | `false` |

## Claude Desktop 集成

要将此服务器集成到 Claude Desktop，请编辑您的 `claude_desktop_config.json` 文件：

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

添加以下配置项：

```json
{
  "mcpServers": {
    "momei": {
      "command": "node",
      "args": ["D:/Projects/typescript-projects/momei/packages/mcp-server/dist/index.mjs"],
      "env": {
        "MOMEI_API_URL": "http://localhost:3000",
        "MOMEI_API_KEY": "你的_API_KEY_在此"
      }
    }
  }
}
```

**注意**：请将 `args` 中的路径替换为您本地 `momei` 项目的实际绝对路径。

## Cursor 集成

在 Cursor 中使用 MCP，可以提高 AI 对您博客内容的理解：

1. 打开 Cursor 设置 (`Ctrl + Shift + J`) -> **Features** -> **MCP**。
2. 点击 **+ Add MCP Server**。
3. 输入名称（例如 `momei`），类型选择 `command`。
4. 在 command 栏输入包含完整路径的命令（见下例）。

```bash
# Windows 示例 (请使用您的实际绝对路径)
node "D:/Projects/typescript-projects/momei/packages/mcp-server/dist/index.mjs"
```

5. 点击右侧的配置文件图标（或手动在 `mcp.json` 中）添加环境变量：
   - `MOMEI_API_URL`: 您的 API 地址
   - `MOMEI_API_KEY`: 您的 API Key

您也可以直接参考项目根目录下的 `mcp.json.example` 文件。

## 性能与测试

本项目经过性能压力测试与基准测试，确保在高并发环境下稳定运行。

### 基准测试 (Benchmarks)

我们在 mock 环境下对 MCP 逻辑层进行了基准测试（CPU: Apple M 系/Intel Core i7 相当）：

| 操作 | 吞吐量 (Requests/s) | 平均延迟 (ms) |
|------|--------------------|--------------|
| `list_posts` | ~300,000+ | < 0.01 ms |
| `get_post` | ~400,000+ | < 0.01 ms |

> *注：基准测试仅反映 MCP Server 包装层的性能损耗，实际操作耗时主要取决于 API 网络延迟。*

### 性能压力测试 (Stress Test)

您可以使用内置脚本对您的实际部署环境进行压力测试：

```bash
# 示例：以 10 并发对本地 API 进行 1000 次列表请求测试
npm run stress-test -- -u http://localhost:3000 -k YOUR_API_KEY -n 1000 -c 10
```

参数说明：
- `-u`: API 地址
- `-k`: API Key (必需)
- `-n`: 总请求量
- `-c`: 并发数
- `-t`: 测试类型 (`list` 或 `get`)

## 安全建议

1. **最小权限原则**：在墨梅后台生成的 API Key 应仅授予必要的权限。
2. **危险操作保护**：默认情况下，删除文章功能是禁用的。除非您完全信任 AI 的操作，否则不建议开启。
3. **日志监控**：主应用会记录所有外部 API 的调用审计日志，建议定期检查。

## 开发

### 调试

由于 MCP 使用标准输入输出（stdio）进行通信，**请勿在代码中使用 `console.log`**。所有调试信息应使用 `console.error` 输出，这样它们会显示在 Claude Desktop 的日志窗口中。

```bash
pnpm dev
```

### 测试

```bash
pnpm test
```
