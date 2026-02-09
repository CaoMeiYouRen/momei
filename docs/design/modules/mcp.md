# MCP 服务器 (MCP Server)

## 1. 概述 (Overview)

MCP (Model Context Protocol) 服务器允许 Claude Desktop 等 AI 客户端通过标准化协议与墨梅博客进行交互，实现 AI 驱动的自动化博客管理。

### 1.1 设计目标

- **零代码迁移**: 基于现有 pnpm workspace 架构，无需修改主应用代码
- **进程隔离**: MCP 服务器作为独立进程运行，不影响主应用稳定性
- **标准协议**: 完全遵循 Anthropic MCP 规范
- **灵活部署**: 支持本地开发、生产环境和远程访问

### 1.2 架构选择

**独立 MCP 服务器** - 通过 stdio 与 Claude Desktop 通信，通过 HTTP API 与主应用交互

```
┌──────────────────────┐
│  Claude Desktop      │
└──────────┬───────────┘
           │ stdio
           ▼
┌──────────────────────┐
│  momei-mcp-server   │  (独立进程)
└──────────┬───────────┘
           │ HTTP + API Key
           ▼
┌──────────────────────┐
│  Momei 主应用        │  (Nitro API)
│  /api/external/posts │
└──────────────────────┘
```

**优势对比:**

| 维度 | 独立服务器 | 集成方案 |
|------|-----------|---------|
| 代码迁移 | 无需修改现有代码 | 需要重构路由层 |
| 传输协议 | stdio (Claude Desktop 推荐) | 主要 HTTP/SSE |
| 资源隔离 | 完全隔离，崩溃不影响主应用 | 共享资源 |
| 部署复杂度 | 需要额外进程管理 | 单一部署单元 |
| 开发体验 | 独立开发测试，更清晰 | 统一代码库 |

## 2. Monorepo 集成 (Monorepo Integration)

### 2.1 目录结构

项目基于 pnpm workspace，MCP 服务器作为独立包存在:

```
momei/
├── pnpm-workspace.yaml        # 添加 'packages/*' 配置
├── cli/                       # 现有包，保持不变
└── packages/
    └── mcp-server/            # MCP 服务器包
        ├── package.json
        ├── tsconfig.json
        ├── README.md
        └── src/
            ├── index.ts       # stdio 服务器入口
            ├── tools/         # MCP 工具实现
            │   ├── posts.ts   # 文章管理工具
            │   ├── media.ts   # 媒体上传工具
            │   └── voice.ts   # 语音转文字工具
            ├── resources/     # 资源提供者
            │   ├── posts.ts
            │   └── stats.ts
            ├── prompts/       # 提示模板
            │   └── templates.ts
            └── lib/
                ├── api.ts     # API 调用封装
                └── config.ts  # 配置管理
```

### 2.2 配置文件

#### pnpm-workspace.yaml

```yaml
packages:
  - 'cli'
  - 'packages/*'     # 新增：支持 packages 目录下的子包
```

#### packages/mcp-server/package.json

```json
{
  "name": "momei-mcp-server",
  "version": "1.0.0",
  "description": "Momei MCP Server - AI automation via Model Context Protocol",
  "type": "module",
  "bin": {
    "momei-mcp": "dist/index.js"
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.4",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@types/node": "^20",
    "typescript": "^5.9.3"
  },
  "engines": {
    "node": ">=20"
  }
}
```

#### packages/mcp-server/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 3. 功能设计 (Feature Design)

### 3.1 核心 Tools (工具)

| 工具名称 | 功能描述 | 参数 |
|---------|---------|------|
| `create_post` | 创建新文章 | title, content, slug?, tags[], language?, status? |
| `update_post` | 更新现有文章 | id, title?, content?, tags?, status? |
| `publish_post` | 发布文章（草稿→已发布） | id, notifySubscribers? |
| `get_post` | 获取文章详情 | id 或 slug |
| `list_posts` | 列出文章列表 | status?, language?, limit?, offset? |
| `delete_post` | 删除文章（软删除） | id |
| `upload_image` | 上传图片并返回 URL | file (base64 或 URL) |
| `create_draft_from_voice` | 语音转草稿 | audioData (base64), language |

### 3.2 Resources (资源)

| 资源名称 | URI | 描述 |
|---------|-----|------|
| `posts` | `momei://posts` | 所有文章列表 |
| `posts/{id}` | `momei://posts/{id}` | 单篇文章详情 |
| `categories` | `momei://categories` | 分类列表 |
| `tags` | `momei://tags` | 标签列表 |
| `stats` | `momei://stats` | 博客统计数据 |

### 3.3 Prompts (提示模板)

| 提示名称 | 描述 |
|---------|------|
| `write_post` | 辅助撰写新文章的模板 |
| `summarize_post` | 生成文章摘要 |
| `translate_post` | 翻译文章到其他语言 |

## 4. API 集成 (API Integration)

### 4.1 认证方式

MCP 服务器通过 API Key 与主应用通信:

```typescript
// packages/mcp-server/src/lib/config.ts
export interface MomeiApiConfig {
  apiUrl: string;      // 主应用 API 地址
  apiKey: string;      // OpenAPI Key
}

export function loadConfig(): MomeiApiConfig {
  return {
    apiUrl: process.env.MOMEI_API_URL || 'http://localhost:3000',
    apiKey: process.env.MOMEI_API_KEY || '',
  };
}
```

### 4.2 API 调用封装

```typescript
// packages/mcp-server/src/lib/api.ts
export class MomeiApi {
  constructor(private config: MomeiApiConfig) {}

  async createPost(data: PostData): Promise<Post> {
    const response = await fetch(`${this.config.apiUrl}/api/external/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getPost(id: string): Promise<Post> {
    const response = await fetch(`${this.config.apiUrl}/api/posts/${id}`, {
      headers: {
        'X-API-Key': this.config.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  // ... 其他 API 方法
}
```

## 5. 核心实现 (Core Implementation)

### 5.1 服务器入口

```typescript
// packages/mcp-server/src/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerPostTools } from "./tools/posts.js";
import { registerPostResources } from "./resources/posts.js";
import { loadConfig } from "./lib/config.js";

const SERVER_NAME = "momei-blog";
const SERVER_VERSION = "1.0.0";

async function main() {
  const config = loadConfig();

  if (!config.apiKey) {
    console.error("Error: MOMEI_API_KEY environment variable is required");
    process.exit(1);
  }

  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // 注册工具
  await registerPostTools(server, config);

  // 注册资源
  await registerPostResources(server, config);

  // 使用 stdio 传输
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Momei MCP Server running on stdio");
  console.error(`API URL: ${config.apiUrl}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

### 5.2 工具注册示例

```typescript
// packages/mcp-server/src/tools/posts.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MomeiApi } from "../lib/api.js";
import type { MomeiApiConfig } from "../lib/config.js";

export async function registerPostTools(server: McpServer, config: MomeiApiConfig) {
  const api = new MomeiApi(config);

  // 创建文章工具
  server.registerTool(
    "create_post",
    {
      description: "Create a new blog post",
      inputSchema: {
        title: z.string().min(1).describe("Post title"),
        content: z.string().min(1).describe("Post content in Markdown"),
        slug: z.string().optional().describe("Custom URL slug"),
        tags: z.array(z.string()).optional().describe("Post tags"),
        language: z.enum(["zh-CN", "en-US"]).optional().describe("Post language"),
        status: z.enum(["draft", "published"]).optional().describe("Post status"),
      },
    },
    async ({ title, content, slug, tags, language, status }) => {
      try {
        const post = await api.createPost({
          title,
          content,
          slug,
          tags,
          language: language || "zh-CN",
          status: status || "draft",
        });

        return {
          content: [
            {
              type: "text",
              text: `Post created successfully!\n\nID: ${post.id}\nURL: ${post.url}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating post: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ... 其他工具注册
}
```

## 6. Claude Desktop 集成 (Claude Desktop Integration)

### 6.1 配置文件

Claude Desktop 配置文件位置:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "momei": {
      "command": "node",
      "args": ["D:/Projects/typescript-projects/momei/packages/mcp-server/dist/index.js"],
      "env": {
        "MOMEI_API_URL": "http://localhost:3000",
        "MOMEI_API_KEY": "momei_sk_your_api_key_here"
      }
    }
  }
}
```

### 6.2 使用示例

在 Claude Desktop 中:
- "帮我创建一篇关于 TypeScript 的文章草稿"
- "发布 ID 为 post_xxx 的文章"
- "列出所有已发布的文章"

## 7. 开发指南 (Development Guide)

### 7.1 本地开发

```bash
# 在项目根目录
pnpm install

# 开发 MCP 服务器
cd packages/mcp-server
pnpm dev

# 构建
pnpm build

# 运行
pnpm start
```

### 7.2 调试技巧

**重要**: MCP 服务器使用 stdio 传输，**不能使用 console.log**，应该使用 console.error 进行日志输出:

```typescript
// ❌ 错误 - 会破坏 stdio 通信
console.log("Server started");

// ✅ 正确 - 输出到 stderr
console.error("Server started");
```

### 7.3 测试

1. 确保 Momei 主应用正在运行
2. 设置正确的 API Key
3. 启动 MCP 服务器
4. 重启 Claude Desktop
5. 在 Claude Desktop 中测试工具调用

## 8. 安全考虑 (Security Considerations)

1. **API Key 管理**: 使用环境变量，避免硬编码
2. **权限校验**: MCP 工具调用需验证用户权限
3. **输入验证**: 使用 Zod 进行严格参数校验
4. **速率限制**: 防止过度调用博客 API
5. **日志脱敏**: 避免在日志中暴露敏感信息

## 9. 部署 (Deployment)

### 9.1 本地部署

适用于个人使用，MCP 服务器和主应用在同一机器上运行。

### 9.2 远程部署

如果需要远程访问，可以:
1. 将 MCP 服务器部署到云服务器
2. 使用 SSH 隧道转发 stdio
3. 或使用 HTTP 传输模式 (需要额外实现)

## 10. 相关文档

- [MCP 官方文档](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [开放 API 设计](./open-api.md)
- [博客模块设计](./blog.md)
- [AI 模块设计](./ai.md)
