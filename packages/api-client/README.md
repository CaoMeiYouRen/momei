# @momei-blog/api-client

[简体中文](./README.md) | [English](./README.en-US.md)

墨梅博客的统一 HTTP 客户端库，为 CLI 和 MCP Server 提供基于 fetch 的共享 API 调用层。

### 设计目标

- **消除重复**：CLI（axios）和 MCP Server（原生 fetch）两套 HTTP 客户端合并为一
- **统一错误处理**：中心化的 `MomeiApiError` 错误类，覆盖 4xx/5xx/超时/网络故障
- **类型安全**：42 个共享 TypeScript 类型，覆盖 Post、Category、Tag、Snippet、AI Task、Post Version、Link Governance 等全部外部 API 领域
- **零运行时依赖**：基于 Node.js 原生 fetch + AbortController，不引入 axios、node-fetch 等第三方 HTTP 库

### 安装

```bash
pnpm add @momei-blog/api-client
```

### 快速开始

```typescript
import { createMomeiApi } from '@momei-blog/api-client'

const api = createMomeiApi({
    apiUrl: 'https://your-momei-instance.com',
    apiKey: 'your-api-key',
})

// 获取文章列表
const posts = await api.posts.list({ status: 'published', limit: 10 })

// 创建文章草稿
const newPost = await api.posts.create({ title: 'Hello', content: 'World' })

// 获取 AI 标题建议
const suggestions = await api.ai.suggestTitles({ content: '文章正文...' })

// 分类管理
const categories = await api.categories.list({ language: 'zh-CN' })

// 标签管理
const tags = await api.tags.list({ limit: 50 })

// 灵感碎片管理
const snippets = await api.snippets.list({ status: 'inbox' })

// 文章版本
const versions = await api.versions.list('post-123')

// 链接治理
const report = await api.migrations.dryRunLinkGovernance({ scopes: ['post-link'] })
```

### 架构

```
@momei-blog/api-client
├── MomeiHttpClient       # 核心 HTTP 客户端（fetch + AbortSignal 超时 + MomeiApiError）
├── PostsApi              # 文章 CRUD + 发布 + 导入验证
├── AiApi                 # AI 标题/标签/分类建议 + 翻译/封面/TTS 任务
├── CategoriesApi         # 分类 CRUD
├── TagsApi               # 标签 CRUD
├── SnippetsApi           # 灵感碎片 CRUD + 转文章
├── VersionsApi           # 文章版本快照
├── MigrationsApi         # 链接治理（dry-run / apply / report）
├── utils                 # extractTagNames 等共享工具
└── types                 # 42 个共享类型定义
```

使用 `createMomeiApi(config)` 工厂函数一键初始化所有 API 领域对象。

### API

#### `createMomeiApi(config: MomeiApiClientConfig): MomeiApi`

```typescript
interface MomeiApiClientConfig {
    apiUrl: string        // 墨梅主应用地址
    apiKey: string        // Open API Key
    timeout?: number      // 请求超时（毫秒，默认 30000）
}
```

返回的 `MomeiApi` 对象包含以下字段：

| 字段 | 类型 | 方法 |
|------|------|------|
| `posts` | `PostsApi` | `list` / `get` / `create` / `update` / `delete` / `publish` / `validate` |
| `ai` | `AiApi` | `suggestTitles` / `recommendTags` / `recommendCategories` / `translatePost` / `generateCoverImage` / `createTTSTask` / `getTask` |
| `categories` | `CategoriesApi` | `list` / `create` / `update` / `delete` |
| `tags` | `TagsApi` | `list` / `create` / `update` / `delete` |
| `snippets` | `SnippetsApi` | `list` / `get` / `create` / `update` / `delete` / `convertToPost` |
| `versions` | `VersionsApi` | `list` / `create` |
| `migrations` | `MigrationsApi` | `dryRunLinkGovernance` / `applyLinkGovernance` / `getLinkGovernanceReport` |

#### 单独使用 HTTP 客户端

```typescript
import { MomeiHttpClient, MomeiApiError } from '@momei-blog/api-client'

const client = new MomeiHttpClient({ apiUrl: 'http://localhost:3000', apiKey: 'xxx' })

try {
    const data = await client.get('/api/external/posts')
    const result = await client.post('/api/external/posts', { title: 'Test' })
    await client.patch('/api/external/posts/1', { status: 'published' })
    await client.delete('/api/external/posts/1')
} catch (error) {
    if (error instanceof MomeiApiError) {
        console.error(`HTTP ${error.status}: ${error.body}`)
    }
}
```

### 错误处理

所有非 2xx 响应会抛出 `MomeiApiError`：

```typescript
class MomeiApiError extends Error {
    status: number        // HTTP 状态码（401、403、500 等）
    statusText: string    // 状态文本
    body: string          // 响应体原文
}
```

网络故障（DNS 失败、连接拒绝等）会以原始 Error 传播，建议调用方统一兜底。

### 开发

```bash
pnpm dev          # 监听模式构建
pnpm build        # 生产构建
pnpm test         # 运行测试
pnpm lint         # 代码检查
pnpm typecheck    # 类型检查
```

### 许可证

MIT
