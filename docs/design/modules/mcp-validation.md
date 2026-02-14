# MCP 生态生产验证设计文档 (MCP Production Validation)

本文档定义了墨梅博客 MCP (Model Context Protocol) 服务器在生产环境下的验证方案。该功能旨在完成 MCP Server 在多环境下的性能压力测试，并完善 MCP 对 Cursor/Claude 等 AI 编辑器的交互定义文件。

## 1. 核心目标

- **多环境验证**: 验证 MCP Server 在本地、Docker、云函数等不同环境下的运行稳定性
- **性能压力测试**: 测试高并发、大数据量场景下的性能表现
- **工具完整性**: 补全所有已承诺的 MCP Tools，确保功能覆盖
- **编辑器兼容**: 完善对 Cursor、Claude Desktop、Windsurf 等主流 AI 编辑器的支持
- **错误处理**: 建立完善的错误处理和降级机制

## 2. 技术方案

### 2.1 MCP Server 架构回顾

```mermaid
graph TB
    subgraph "AI Editor"
        A[Cursor/Claude] -->|stdio|MCP Client
    end

    subgraph "MCP Server"
        B[stdio Transport]
        C[Tool Handlers]
        D[API Client]
        E[Error Handler]
    end

    subgraph "Momei API"
        F[REST API]
        G[Authentication]
    end

    A --> B
    B --> C
    C --> D
    D --> F
    F --> G
    C --> E
```

### 2.2 测试环境矩阵

| 环境 | 部署方式 | 网络隔离 | 验证重点 | 状态 |
|:---|:---|:---|:---|:---|
| **本地开发** | `pnpm dev` | 无 | 功能正确性、开发体验 | ✅ |
| **Docker 容器** | docker-compose | 容器级 | 生产配置、资源限制 | ⬜ |
| **Vercel Serverless** | ver.json | 平台级 | 冷启动、配额限制 | ⬜ |
| **自部署 VPS** | PM2/nginx | 系统级 | 长期稳定性、日志 | ⬜ |

## 3. 功能补全

### 3.1 核心工具实现状态

| 工具 | 描述 | 实现状态 | 测试覆盖 |
|:---|:---|:---|:---|
| `list_posts` | 列出文章列表 | ✅ 已实现 | ⬜ 待补充 |
| `get_post` | 获取文章详情 | ✅ 已实现 | ⬜ 待补充 |
| `create_post` | 创建新文章草稿 | ✅ 已实现 | ⬜ 待补充 |
| `update_post` | 更新现有文章 | ✅ 已实现 | ⬜ 待补充 |
| `publish_post` | 发布文章 | ✅ 已实现 | ⬜ 待补充 |
| `upload_image` | 上传图片 | ⬜ 待实现 | - |
| `delete_post` | 删除文章 | ⬜ 待实现 | - |
| `list_categories` | 列出分类 | ⬜ 待实现 | - |
| `list_tags` | 列出标签 | ⬜ 待实现 | - |

### 3.2 图片上传工具实现

```typescript
// packages/mcp-server/src/tools/media.ts
import { z } from 'zod'
import type { Tool } from '@modelcontextprotocol/sdk'

export const uploadImageTool: Tool = {
    name: 'upload_image',
    description: 'Upload an image to Momei blog storage and return its URL',
    inputSchema: {
        type: 'object',
        properties: {
            imageData: {
                type: 'string',
                description: 'Base64 encoded image data (with or without data URL prefix)',
            },
            filename: {
                type: 'string',
                description: 'Original filename (for extension detection)',
            },
            alt: {
                type: 'string',
                description: 'Alt text for accessibility',
            },
        },
        required: ['imageData', 'filename'],
    } as const,
},

async execute({ imageData, filename, alt }) {
    try {
        // 1. 提取 Base64 数据
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')

        // 2. 检测文件大小限制
        const MAX_SIZE = 10 * 1024 * 1024  // 10MB
        if (buffer.length > MAX_SIZE) {
            throw new Error(`Image size exceeds maximum allowed size of ${MAX_SIZE} bytes`)
        }

        // 3. 确定文件扩展名
        const ext = filename.split('.').pop() || 'png'

        // 4. 调用 Momei API 上传
        const formData = new FormData()
        const blob = new Blob([buffer], { type: `image/${ext}` })
        formData.append('file', blob, filename)
        if (alt) {
            formData.append('alt', alt)
        }

        const response = await fetch(`${API_BASE_URL}/api/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
            },
            body: formData,
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(`Upload failed: ${error.message}`)
        }

        const data = await response.json()

        return {
            content: [{
                type: 'text',
                text: `Image uploaded successfully. URL: ${data.url}`,
            }],
        }
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: `Error uploading image: ${error.message}`,
            }],
            isError: true,
        }
    }
},
}
```

### 3.3 删除文章工具实现

```typescript
// packages/mcp-server/src/tools/posts.ts
export const deletePostTool: Tool = {
    name: 'delete_post',
    description: 'Soft delete a post from Momei blog (requires admin privileges)',
    inputSchema: {
        type: 'object',
        properties: {
            id: {
                type: 'string',
                description: 'Post ID to delete',
            },
        },
        required: ['id'],
    } as const,
},

async execute({ id }) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/external/posts/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Post not found')
            }
            if (response.status === 403) {
                throw new Error('Insufficient permissions to delete posts')
            }
            throw new Error(`Failed to delete post: ${response.statusText}`)
        }

        return {
            content: [{
                type: 'text',
                text: `Post ${id} has been soft deleted successfully`,
            }],
        }
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: `Error deleting post: ${error.message}`,
            }],
            isError: true,
        }
    }
},
}
```

## 4. 性能压力测试

### 4.1 测试场景

```typescript
// packages/mcp-server/tests/performance/tools.test.ts
import { describe, it, expect } from 'vitest'
import { Benchmark } from 'vitest/node'

describe('MCP Tools Performance', () => {
    const benchmark = new Benchmark()

    it('list_posts should handle 1000+ posts efficiently', async () => {
        const startTime = performance.now()

        const result = await listPostsTool.execute({
            limit: 1000,
            status: 'published',
        })

        const duration = performance.now() - startTime

        expect(result.isError).toBe(false)
        expect(duration).toBeLessThan(5000)  // 5 秒内完成

        console.log(`list_posts (1000 items): ${duration.toFixed(2)}ms`)
    })

    it('create_post should handle large content', async () => {
        const largeContent = '# '.repeat(100) + '\n' + 'Large post content.\n'

        const startTime = performance.now()

        const result = await createPostTool.execute({
            title: 'Large Post Test',
            content: largeContent,
            language: 'zh-CN',
        })

        const duration = performance.now() - startTime

        expect(result.isError).toBe(false)
        expect(duration).toBeLessThan(3000)  // 3 秒内完成

        console.log(`create_post (large content): ${duration.toFixed(2)}ms`)
    })

    it('concurrent operations should not cause race conditions', async () => {
        const operations = Array.from({ length: 10 }, (_, i) =>
            createPostTool.execute({
                title: `Concurrent Test ${i}`,
                content: 'Test content',
            })
        )

        const results = await Promise.allSettled(operations)

        const successful = results.filter(r => !r.isError).length
        expect(successful).toBe(10)  // 所有操作都应成功
    })
})
```

### 4.2 资源监控

```typescript
// packages/mcp-server/src/utils/monitor.ts
export class PerformanceMonitor {
    private metrics = new Map<string, number[]>()

    record(operation: string, duration: number) {
        if (!this.metrics.has(operation)) {
            this.metrics.set(operation, [])
        }
        this.metrics.get(operation)!.push(duration)
    }

    getStats(operation: string) {
        const durations = this.metrics.get(operation) || []
        if (durations.length === 0) return null

        const sorted = [...durations].sort((a, b) => a - b)
        return {
            count: durations.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            avg: durations.reduce((a, b) => a + b) / durations.length,
            p50: sorted[Math.floor(sorted.length / 2)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)],
        }
    }

    report() {
        console.log('=== Performance Report ===')
        for (const [operation, durations] of this.metrics.entries()) {
            const stats = this.getStats(operation)
            console.log(`${operation}:`, stats)
        }
    }
}
```

## 5. 编辑器兼容性完善

### 5.1 Cursor 集成配置

```json
// packages/mcp-server/.cursor/mcp.json
{
    "mcpServers": {
        "momei": {
            "command": "node",
            "args": ["dist/index.js"],
            "env": {
                "MOMEI_API_URL": "http://localhost:3000",
                "MOMEI_API_KEY": "your-api-key-here"
            }
        }
    }
}
```

### 5.2 Claude Desktop 配置

```json
// packages/mcp-server/.claude/mcp.json
{
    "mcpServers": {
        "momei": {
            "command": "node",
            "args": ["dist/index.js"],
            "env": {
                "MOMEI_API_URL": "http://localhost:3000",
                "MOMEI_API_KEY": "your-api-key-here"
            }
        }
    }
}
```

### 5.3 Windsurf 配置

```json
// packages/mcp-server/.windsurf/mcp.json
{
    "servers": {
        "momei": {
            "command": "node",
          "args": ["dist/index.js"],
            "env": {
                "MOMEI_API_URL": "http://localhost:3000",
                "MOMEI_API_KEY": "your-api-key-here"
            }
        }
    }
}
```

## 6. 错误处理与降级

### 6.1 错误分类与处理

```typescript
// packages/mcp-server/src/utils/errors.ts
export enum MCPErrorCode {
    // 客户端错误
    INVALID_INPUT = 'INVALID_INPUT',
    MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

    // API 错误
    API_CONNECTION_FAILED = 'API_CONNECTION_FAILED',
    API_RATE_LIMITED = 'API_RATE_LIMITED',
    API_UNAUTHORIZED = 'API_UNAUTHORIZED',

    // 资源错误
    RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
    RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',

    // 系统错误
    INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class MCPError extends Error {
    constructor(
        public code: MCPErrorCode,
        message: string,
        public details?: any
    ) {
        super(message)
        this.name = 'MCPError'
    }

    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            details: this.details,
        }
    }
}

export function handleAPIError(error: any): MCPError {
    if (error.response) {
        const status = error.response.status
        const data = error.response.data

        switch (status) {
            case 401:
                return new MCPError(
                    MCPErrorCode.API_UNAUTHORIZED,
                    'Authentication failed. Please check your API key.',
                )
            case 404:
                return new MCPError(
                    MCPErrorCode.RESOURCE_NOT_FOUND,
                    'The requested resource was not found.',
                    { resource: data.path },
                )
            case 409:
                return new MCPError(
                    MCPErrorCode.RESOURCE_CONFLICT,
                    'Resource conflict. The resource may have been modified.',
                    { conflict: data.details },
                )
            case 429:
                return new MCPError(
                    MCPErrorCode.API_RATE_LIMITED,
                    'API rate limit exceeded. Please try again later.',
                    { retryAfter: data.retryAfter },
                )
            default:
                return new MCPError(
                    MCPErrorCode.INTERNAL_ERROR,
                    data.message || 'An unexpected error occurred.',
                )
        }
    }

    if (error.request) {
        return new MCPError(
            MCPErrorCode.API_CONNECTION_FAILED,
            'Failed to connect to Momei API. Please check your network.',
        )
    }

    return new MCPError(
        MCPErrorCode.INTERNAL_ERROR,
        error.message || 'An unknown error occurred.',
    )
}
```

### 6.2 降级策略

```typescript
// packages/mcp-server/src/utils/fallback.ts
export class FallbackHandler {
    private static cache = new Map<string, any>()
    private static CACHE_TTL = 5 * 60 * 1000  // 5 分钟

    static async withFallback<T>(
        key: string,
        fn: () => Promise<T>,
        fallback?: () => T
    ): Promise<T> {
        // 检查缓存
        const cached = this.getFromCache<T>(key)
        if (cached) {
            console.warn(`Using stale cache for ${key}`)
            return cached
        }

        try {
            const result = await fn()
            this.setToCache(key, result)
            return result
        } catch (error) {
            if (fallback) {
                console.warn(`Primary operation failed for ${key}, using fallback`)
                return fallback()
            }
            throw error
        }
    }

    private static getFromCache<T>(key: string): T | null {
        const cached = this.cache.get(key)
        if (!cached) return null

        if (Date.now() - cached.timestamp > this.CACHE_TTL) {
            this.cache.delete(key)
            return null
        }

        return cached.value as T
    }

    private static setToCache<T>(key: string, value: T): void {
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
        })
    }
}
```

## 7. 测试策略

### 7.1 单元测试

```typescript
// packages/mcp-server/tests/unit/tools.test.ts
import { describe, it, expect, vi } from 'vitest'

describe('MCP Tools', () => {
    describe('list_posts', () => {
        it('should parse input correctly', async () => {
            const result = await listPostsTool.execute({
                status: 'published',
                limit: 10,
            })

            expect(result.isError).toBe(false)
            expect(result.content).toBeDefined()
        })

        it('should validate invalid status', async () => {
            const result = await listPostsTool.execute({
                status: 'invalid' as any,
            })

            expect(result.isError).toBe(true)
        })
    })

    describe('create_post', () => {
        it('should require title', async () => {
            const result = await createPostTool.execute({
                content: 'Test',
            })

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('title')
        })
    })
})
```

### 7.2 集成测试

```typescript
// packages/mcp-server/tests/integration/e2e.test.ts
import { describe, it, expect } from 'vitest'
import { setupTestServer, teardownTestServer } from './helpers'

describe('E2E Workflows', () => {
    let testServer: any

    beforeAll(async () => {
        testServer = await setupTestServer()
    })

    afterAll(async () => {
        await teardownTestServer(testServer)
    })

    it('should create and publish a post', async () => {
        // 1. Create draft
        const createResult = await createPostTool.execute({
            title: 'E2E Test Post',
            content: 'This is a test post.',
            language: 'zh-CN',
        })

        expect(createResult.isError).toBe(false)

        const postId = extractPostId(createResult)

        // 2. Publish
        const publishResult = await publishPostTool.execute({
            id: postId,
        })

        expect(publishResult.isError).toBe(false)

        // 3. Verify
        const getResult = await getPostTool.execute({ id: postId })
        expect(getResult.content[0].text).toContain('published')
    })
})
```

## 8. 部署配置

### 8.1 Docker 配置

```dockerfile
# packages/mcp-server/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app

RUN addgroup -g mcp --gid 1001 && \
    adduser --uid 1001 --ingroup mcp --home /app --shell /sbin/nologin -G mcp mcp

COPY --from=builder --chown=mcp:mcp /app/dist ./dist
COPY --from=builder --chown=mcp:mcp /app/node_modules ./node_modules
COPY --from=builder --chown=mcp:mcp /app/package.json ./package.json

USER mcp
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
```

### 8.2 Docker Compose

```yaml
# packages/mcp-server/docker-compose.yml
version: '3.8'

services:
  mcp-server:
    build: .
    environment:
      - MOMEI_API_URL=${MOMEI_API_URL}
      - MOMEI_API_KEY=${MOMEI_API_KEY}
      - NODE_ENV=production
      - LOG_LEVEL=info
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('./dist/index.js')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### 8.3 Vercel 部署

```json
// packages/mcp-server/vercel.json
{
    "version": 2,
    "builds": [
        {
            "src": "package.json",
            "use": "@vercel/static-build",
            "config": {
                "distDir": "dist"
            }
        }
    ],
    "routes": [
        {
            "src": "/(.*)",
            "dest": "/api/$1"
        }
    ]
}
```

## 9. 环境变量配置

```env
# Momei API 配置
MOMEI_API_URL=http://localhost:3000
MOMEI_API_KEY=your-api-key-here

# MCP Server 配置
MCP_SERVER_NAME=momei
MCP_SERVER_VERSION=1.0.0
LOG_LEVEL=info

# 性能配置
MCP_MAX_CONCURRENT_REQUESTS=10
MCP_REQUEST_TIMEOUT=30000
MCP_CACHE_ENABLED=true
MCP_CACHE_TTL=300000
```

## 10. 实现路线图

### Phase 1: 功能补全
- [ ] 实现 `upload_image` 工具
- [ ] 实现 `delete_post` 工具
- [ ] 实现 `list_categories` 和 `list_tags` 工具
- [ ] 添加工具参数验证

### Phase 2: 性能测试
- [ ] 编写性能压力测试用例
- [ ] 实现性能监控工具
- [ ] 执行基准测试并优化

### Phase 3: 环境验证
- [ ] Docker 容器化部署
- [ ] Vercel Serverless 部署
- [ ] 自部署 VPS 配置

### Phase 4: 兼容性完善
- [ ] Cursor 集成文档
- [ ] Claude Desktop 配置
- [ ] Windsurf 支持验证

### Phase 5: 稳定性增强
- [ ] 完善错误处理
- [ ] 添加降级策略
- [ ] 实现日志与监控
