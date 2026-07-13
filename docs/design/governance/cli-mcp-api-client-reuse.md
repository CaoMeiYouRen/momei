# CLI 与 MCP 包 API 客户端代码复用优化方案

> **文档类型**: 治理方案（执行完毕）
> **创建日期**: 2026-07-06
> **状态**: 已执行 — Phase 54 (阶段一) + Phase 55 (阶段二) 已完成
> **关联 Backlog**: 短期候选任务 — 已上收为两条 P1 主线

## 1. 背景与问题

### 1.1 当前架构

项目包含两个独立的客户端包：
- `packages/cli` - 命令行工具，用于文章导入、AI 自动化等
- `packages/mcp-server` - MCP 服务器，为 AI 助手提供工具接口

两者都通过 HTTP 调用 `server/api/external/` 下的外部接口。

### 1.2 代码重复问题

| 重复类型 | CLI 包 | MCP 包 | 影响 |
|----------|--------|--------|------|
| HTTP 客户端 | `axios` (api-client.ts) | 原生 `fetch` (lib/api.ts) | 依赖不同、错误处理不一致 |
| API 方法 | 18 个方法 | 13 个方法 | 核心逻辑重复 |
| 类型定义 | types.ts (335 行) | 内联/JsonRecord | 类型安全程度不同 |
| 工具函数 | extractExistingTagNames | extractTagNames | 实现几乎相同 |

### 1.3 功能缺失分析

#### CLI 包缺失的接口

| 接口 | 影响场景 |
|------|----------|
| `GET /api/external/posts` | 无法列出文章、无法批量操作 |
| `PATCH /api/external/posts/[id]` | 无法更新文章内容/元数据 |
| `DELETE /api/external/posts/[id]` | 无法删除文章 |

#### MCP 包缺失的接口

| 接口 | 影响场景 |
|------|----------|
| `POST /api/external/posts/validate` | 无法验证导入路径别名 |
| `POST /link-governance/dry-run` | 无法执行链接治理预览 |
| `POST /link-governance/apply` | 无法执行链接治理应用 |
| `GET /link-governance/reports/[id]` | 无法查看链接治理报告 |

## 2. 优化目标

1. **消除代码重复**: 提取共享 API 客户端库，减少 60-70% 重复代码
2. **统一类型安全**: 共享完整的 TypeScript 类型定义
3. **补齐缺失功能**: 两个包都支持所有外部接口
4. **保持独立性**: CLI 和 MCP 的特定功能（进度显示、工具注册）不受影响

## 3. 方案设计

### 3.1 方案一：提取共享 API 客户端库（推荐）

创建新包 `packages/api-client`（`@momei-blog/api-client`），包含：

```
packages/api-client/
├── src/
│   ├── index.ts           # 导出入口
│   ├── client.ts          # 统一 HTTP 客户端
│   ├── types.ts           # 共享类型定义
│   ├── posts.ts           # Posts 相关 API
│   ├── ai.ts              # AI 相关 API
│   ├── migrations.ts      # Migrations 相关 API
│   └── utils.ts           # 共享工具函数
├── package.json
├── tsconfig.json
└── tsdown.config.ts
```

#### 核心设计

**1. 统一 HTTP 客户端 (client.ts)**

```typescript
export interface MomeiApiClientConfig {
  apiUrl: string
  apiKey: string
  timeout?: number
}

export class MomeiHttpClient {
  private config: MomeiApiClientConfig

  constructor(config: MomeiApiClientConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    }
  }

  async request<T>(path: string, options?: RequestInit): Promise<ApiEnvelope<T>> {
    const url = `${this.config.apiUrl}${path}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey,
        ...options?.headers,
      },
      signal: AbortSignal.timeout(this.config.timeout),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new MomeiApiError(response.status, response.statusText, errorText)
    }

    return response.json() as Promise<ApiEnvelope<T>>
  }

  async get<T>(path: string): Promise<ApiEnvelope<T>> {
    return this.request<T>(path)
  }

  async post<T>(path: string, data?: unknown): Promise<ApiEnvelope<T>> {
    return this.request<T>(path, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(path: string, data?: unknown): Promise<ApiEnvelope<T>> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(path: string): Promise<ApiEnvelope<T>> {
    return this.request<T>(path, { method: 'DELETE' })
  }
}
```

**2. 共享类型定义 (types.ts)**

```typescript
// 从 CLI 的 types.ts 迁移，保持向后兼容
export interface ApiEnvelope<TData> {
  code?: number
  data: TData
  message?: string
}

export interface MomeiPost {
  title: string
  content: string
  slug?: string
  // ... 其他字段
}

export interface PostListQuery {
  status?: 'draft' | 'pending' | 'published' | 'rejected' | 'hidden'
  language?: string
  search?: string
  page?: number
  limit?: number
  orderBy?: string
  order?: 'ASC' | 'DESC'
}

// ... 其他类型定义
```

**3. API 方法集合 (posts.ts, ai.ts, migrations.ts)**

```typescript
// posts.ts
export class PostsApi {
  constructor(private client: MomeiHttpClient) {}

  async list(query?: PostListQuery): Promise<ApiEnvelope<PostListResponse>> {
    const searchParams = new URLSearchParams()
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }
    const queryString = searchParams.toString()
    return this.client.get(`/api/external/posts${queryString ? `?${queryString}` : ''}`)
  }

  async get(id: string): Promise<ApiEnvelope<MomeiPost>> {
    return this.client.get(`/api/external/posts/${id}`)
  }

  async create(data: CreatePostRequest): Promise<ApiEnvelope<{ id: string }>> {
    return this.client.post('/api/external/posts', data)
  }

  async update(id: string, data: UpdatePostRequest): Promise<ApiEnvelope<MomeiPost>> {
    return this.client.patch(`/api/external/posts/${id}`, data)
  }

  async delete(id: string): Promise<ApiEnvelope<void>> {
    return this.client.delete(`/api/external/posts/${id}`)
  }

  async publish(id: string): Promise<ApiEnvelope<{ id: string; status: string }>> {
    return this.client.post(`/api/external/posts/${id}/publish`)
  }

  async validate(data: ValidatePostRequest): Promise<ApiEnvelope<ValidationReport>> {
    return this.client.post('/api/external/posts/validate', data)
  }
}
```

**4. 统一导出 (index.ts)**

```typescript
export { MomeiHttpClient, MomeiApiError } from './client'
export type { MomeiApiClientConfig } from './client'
export { PostsApi } from './posts'
export { AiApi } from './ai'
export { MigrationsApi } from './migrations'
export * from './types'
export { extractTagNames } from './utils'

// 便捷工厂函数
export function createMomeiApi(config: MomeiApiClientConfig) {
  const client = new MomeiHttpClient(config)
  return {
    posts: new PostsApi(client),
    ai: new AiApi(client),
    migrations: new MigrationsApi(client),
  }
}
```

### 3.2 方案二：在现有包中创建内部共享模块

如果不想创建新包，可以在 `packages/cli` 中创建共享模块，`packages/mcp-server` 依赖它。

**缺点**：
- 依赖方向不合理（MCP 依赖 CLI）
- 增加 MCP 包的依赖负担

### 3.3 方案三：使用 monorepo workspace 协议

利用 pnpm workspace 协议，让 CLI 和 MCP 包都依赖一个共享的本地包。

**与方案一的区别**：
- 方案一更正式，有独立的 package.json 和构建配置
- 方案三更轻量，但可能影响发布流程

## 4. 实施计划

### 4.1 阶段一：补齐现有外部接口的客户端支持（低风险）

**CLI 包补充**：
1. `listPosts()` - 调用 `GET /api/external/posts`
2. `updatePost()` - 调用 `PATCH /api/external/posts/[id]`
3. `deletePost()` - 调用 `DELETE /api/external/posts/[id]`

**MCP 包补充**：
1. `validateImportPost()` - 调用 `POST /api/external/posts/validate`
2. `dryRunLinkGovernance()` - 调用 `POST /api/external/migrations/link-governance/dry-run`
3. `applyLinkGovernance()` - 调用 `POST /api/external/migrations/link-governance/apply`
4. `getLinkGovernanceReport()` - 调用 `GET /api/external/migrations/link-governance/reports/[reportId]`

**工作量**：约 2-3 小时
**风险**：低，纯增量改动

### 4.2 阶段二：新增高优先级外部接口（需要服务端配合）

建议新增以下外部接口：

**分类和标签管理（高频需求）**：
- `GET /api/external/categories` - 查询分类列表
- `POST /api/external/categories` - 创建分类
- `PUT /api/external/categories/[id]` - 更新分类
- `DELETE /api/external/categories/[id]` - 删除分类
- `GET /api/external/tags` - 查询标签列表
- `POST /api/external/tags` - 创建标签
- `PUT /api/external/tags/[id]` - 更新标签
- `DELETE /api/external/tags/[id]` - 删除标签

**灵感/片段管理（创作流程）**：
- `GET /api/external/snippets` - 查询灵感列表
- `POST /api/external/snippets` - 创建灵感（已支持 API Key）
- `PUT /api/external/snippets/[id]` - 更新灵感
- `DELETE /api/external/snippets/[id]` - 删除灵感
- `POST /api/external/snippets/[id]/convert` - 灵感转文章

**文章版本管理（协作需求）**：
- `GET /api/external/posts/[id]/versions` - 查询版本历史
- `GET /api/external/posts/[id]/versions/[versionId]` - 获取版本详情
- `POST /api/external/posts/[id]/versions/[versionId]/restore` - 恢复版本

**AI 增强功能**：
- `POST /api/external/ai/suggest-slug` - AI 建议 slug
- `POST /api/external/ai/suggest-image-prompt` - AI 建议图片提示词
- `POST /api/external/ai/refine-voice` - AI 润色文风
- `POST /api/external/ai/scaffold/generate` - AI 生成大纲
- `POST /api/external/ai/translate` - AI 翻译文本
- `GET /api/external/ai/tts/voices` - 获取 TTS 语音列表

**工作量**：约 8-12 小时
**风险**：中，需要服务端配合实现新接口

### 4.3 阶段三：提取共享 API 客户端库

1. 创建 `packages/api-client` 包
2. 迁移 CLI 的 `types.ts` 到共享包
3. 实现统一的 HTTP 客户端类
4. 迁移所有 API 方法到共享包
5. 更新 CLI 和 MCP 包，使用共享客户端
6. 移除重复代码
7. 更新测试

**工作量**：约 6-8 小时
**风险**：中，需要仔细处理向后兼容性

## 5. 验收标准

### 5.1 阶段一验收标准

- [ ] CLI 包新增 3 个 API 方法并通过测试
- [ ] MCP 包新增 4 个 API 方法并通过测试
- [ ] 两个包的 API 方法覆盖率达到 100%
- [ ] `pnpm typecheck` 和 `pnpm lint` 通过

### 5.2 阶段二验收标准

- [ ] 新增 15+ 个外部接口
- [ ] 所有新接口有 Zod schema 验证
- [ ] 所有新接口有对应的 CLI/MCP 方法
- [ ] 接口文档更新

### 5.3 阶段三验收标准

- [ ] `@momei-blog/api-client` 包创建完成
- [ ] CLI 和 MCP 包使用共享客户端
- [ ] 代码重复率下降 60%+
- [ ] `duplicate-code:check` 基线不反弹
- [ ] 所有现有测试通过

## 6. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 向后兼容性破坏 | CLI/MCP 用户受影响 | 保持旧 API 签名，添加 deprecation 警告 |
| 依赖冲突 | 构建失败 | 使用 peer dependencies，统一版本 |
| 测试覆盖不足 | 回归问题 | 先补充测试再迁移 |
| 服务端接口变更 | 客户端同步更新 | 建立接口版本管理机制 |

## 7. 相关文档

- [项目计划](../../plan/roadmap.md)
- [待办事项](../../plan/todo.md)
- [长期规划与积压项](../../plan/backlog.md)
- [开发规范](../../standards/development.md)
- [API 设计](../api.md)
- [CLI 包源码](../../../packages/cli/README.md)
- [MCP 包源码](../../../packages/mcp-server/README.md)
