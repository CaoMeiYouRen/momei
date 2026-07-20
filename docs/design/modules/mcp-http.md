# MCP HTTP 传输与本体挂载设计 (MCP HTTP Transport & Host Mount)

## 1. 概述 (Overview)

当前 MCP 服务器 (`packages/mcp-server`) 仅支持 **stdio** 传输协议，AI 客户端（Claude Desktop、Cursor 等）必须通过本地子进程方式启动独立 Node.js 进程。这限制了远程访问、云上部署及多客户端复用一个服务端的场景。

本设计文档定义如何为 MCP 服务器增加 **HTTP 传输协议**支持，并将 MCP 服务挂载到墨梅主应用（Nuxt/Nitro）中，使其作为主应用的一个可选内部服务运行。

### 1.1 设计目标

- **Streamable HTTP 协议**: 基于 MCP SDK v1.29.0 推荐的 `StreamableHTTPServerTransport`，提供标准 HTTP 接入方式。
- **本体挂载**: MCP 服务作为 Nitro 插件挂载于主应用，复用相同进程与端口，无需独立部署。
- **默认关闭**: 通过环境变量控制启用，避免默认增加攻击面和资源消耗。
- **动态导入**: 未启用时不加载 MCP SDK 及其依赖，零冷启动影响。
- **安全复用**: 复用现有 `/api/external/*` 的 API Key 鉴权中间件，保持一致的安全策略。

### 1.2 决策记录

| 决策项 | 结论 | 理由 |
|--------|------|------|
| 依赖策略 | `@modelcontextprotocol/sdk` 添加为根依赖 | 动态导入下不影响冷启动，避免先做共享层抽取的前置依赖 |
| HTTP 路径 | `/api/mcp` | 与现有 `/api/external/*` 路径风格一致，便于统一鉴权和限流 |
| Serverless 策略 | 静默降级 | SSE 长连接不可用时自动不启用 MCP HTTP，不报错不阻塞启动 |
| 认证策略 | 复用外部 API Key | 与 `/api/external/*` 共用 `X-API-Key` 鉴权中间件 |
| 阶段归属 | 先入 backlog 短期候选 | 不插队当前阶段，待下一新功能面上收 |

## 2. 架构设计 (Architecture)

### 2.1 组件关系

```
┌─ AI Client (支持 HTTP 的 MCP 客户端) ─────────────────┐
│  通过 HTTP + SSE 与 MCP 端点通信                       │
│  配置: { "url": "https://momei.app/api/mcp" }          │
└──────────────────────┬─────────────────────────────────┘
                       │ HTTP (GET / POST / DELETE)
                       │ X-API-Key 认证
┌──────────────────────▼─────────────────────────────────┐
│               Nuxt 4 + Nitro 服务端                       │
│                                                          │
│  ┌──────────────┐   ┌──────────────────────────────┐    │
│  │ server/      │   │ Nitro Plugin: mcp-http        │    │
│  │ api/external │   │                              │    │
│  │   (REST)     │   │  defineNitroPlugin() {       │    │
│  │              │   │    if (!env.MCP_HTTP) return  │    │
│  │ 共用 API Key │   │    dynamic import SDK         │    │
│  │ 鉴权中间件    │   │    create McpServer           │    │
│  └──────────────┘   │    register all tools         │    │
│                      │    connect HTTP transport    │    │
│                      │    handle GET/POST/DELETE    │    │
│                      └──────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │            server/services/*                      │    │
│  │   (文章 / 分类 / 标签 / AI / 导入等)              │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### 2.2 运行模式

MCP 服务在启用 HTTP 后可同时支持两种运行模式，互不冲突：

| 模式 | 传输 | 启动方式 | 适用场景 |
|------|------|---------|---------|
| **独立进程（现有）** | stdio | AI 客户端本地拉起 | Claude Desktop、Cursor 本地集成 |
| **本体挂载（新增）** | HTTP | 随主应用 Nitro 启动 | 远程访问、多云客户端共享、部署环境 |

### 2.3 HTTP 协议映射

根据 Streamable HTTP 规范，单一端点 `/api/mcp` 处理三种 HTTP 方法：

| HTTP 方法 | 用途 | 说明 |
|-----------|------|------|
| `GET /api/mcp` | 建立 SSE 流 | 客户端通过 Server-Sent Events 接收服务端推送的消息 |
| `POST /api/mcp` | 发送 JSON-RPC 请求 | 客户端通过 POST 发送工具调用等 JSON-RPC 消息 |
| `DELETE /api/mcp` | 终止会话 | 可选操作，用于客户端主动关闭 MCP 会话 |

#### 请求/响应示例

**初始化连接 (GET)**:
```
GET /api/mcp HTTP/1.1
Authorization: Bearer <api-key>
Accept: text/event-stream
```
→ 响应: `Content-Type: text/event-stream`，持续推送 SSE 事件

**工具调用 (POST)**:
```
POST /api/mcp HTTP/1.1
Authorization: Bearer <api-key>
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": "req-001",
  "method": "tools/call",
  "params": {
    "name": "list_posts",
    "arguments": { "limit": 10 }
  }
}
```
→ 响应: JSON-RPC 响应或 SSE 事件（取决于流式/非流式）

## 3. 环境变量与配置 (Configuration)

### 3.1 新增环境变量

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `MOMEI_ENABLE_MCP_HTTP` | `boolean` | `false` | 是否在主应用挂载 MCP HTTP 服务 |

### 3.2 复用环境变量

| 变量名 | 来源 | 说明 |
|--------|------|------|
| `MOMEI_API_KEY` | 已有（MCP 配置） | HTTP API Key 鉴权，与外部 API 共用密钥体系 |
| `NUXT_RATE_LIMIT_EXTERNAL_MAX` | 已有 | 复用外部 API 速率限制配置 |
| `NUXT_RATE_LIMIT_EXTERNAL_WINDOW` | 已有 | 复用外部 API 限流窗口 |

### 3.3 逻辑依赖链

```
MOMEI_ENABLE_MCP_HTTP=true
  ├─ 从 process.env 读取（Nitro 构建时可见）
  ├─ 进入 NitroPlugin 的条件守卫
  ├─ 动态加载 @modelcontextprotocol/sdk
  ├─ 读取 MOMEI_API_KEY 做请求鉴权
  └─ 注册 GET/POST/DELETE 路由处理
```

## 4. 实现方案 (Implementation)

### 4.1 插件骨架（参考 task-scheduler.ts 模式）

```
server/plugins/mcp-http.ts
```

实现步骤：

1. **条件守卫**: 检查 `process.env.MOMEI_ENABLE_MCP_HTTP !== 'true'`，否则静默返回
2. **动态导入**: `await import('@modelcontextprotocol/sdk/server/mcp.js')` 等，不启用时不加载依赖
3. **McpServer 实例化**: 复用 `packages/mcp-server/src/index.ts` 中相同的 33 个工具注册流程
4. **Transport 创建**: 实例化 `StreamableHTTPServerTransport`，配置 session ID 生成器
5. **路由注册**: 通过 Nitro 的 `defineEventHandler` 或 NitroApp hooks 拦截 `/api/mcp` 路径
6. **请求分发**: 将 h3 event 转换为 transport 需要的 req/res 格式
7. **连接**: `server.connect(transport)`

### 4.2 Transport 适配策略

由于 `StreamableHTTPServerTransport` 接收 Node.js 原生 `IncomingMessage`/`ServerResponse`，而 Nitro 使用 h3 封装，需要做适配转换：

```typescript
// 方案一：直接使用 StreamableHTTPServerTransport
// 从 h3 event 中获取 node 原生 req/res
import { getNodeRequest, getNodeResponse } from 'h3-node'
const nodeReq = getNodeRequest(event)
const nodeRes = getNodeResponse(event)
await transport.handleRequest(nodeReq, nodeRes, parsedBody)

// 方案二：备选使用 WebStandardStreamableHTTPServerTransport
// 在 Serverless 环境中降级（如 Vercel）
// 通过 h3 的 event.request（Web Standard Request）调用
const response = await webTransport.handleRequest(event.request)
```

**Serverless 静默降级逻辑**:
```typescript
let isSseSupported = true
try {
    if (process.env.VERCEL || process.env.CF_PAGES) {
        // Serverless 环境 SSE 支持有限，静默降级
        isSseSupported = false
    }
} catch {
    isSseSupported = false
}

if (!isSseSupported) {
    logger.info('[MCP-HTTP] SSE not supported in this environment, MCP HTTP disabled.')
    return
}
```

### 4.3 鉴权复用

复用 `/api/external/*` 现有的 API Key 鉴权中间件（`server/middleware/1-auth.ts` 或其他相关中间件），在请求到达 `/api/mcp` 前完成身份校验：

```typescript
// Nitro 中间件级别：对 /api/mcp 路径做 API Key 校验
// 与 server/middleware/ 中外部 API 鉴权逻辑一致
if (event.path.startsWith('/api/mcp')) {
    const apiKey = getHeader(event, 'x-api-key')
    if (!apiKey || apiKey !== process.env.MOMEI_API_KEY) {
        throw createError({ statusCode: 401, message: 'Invalid API Key' })
    }
}
```

### 4.4 工具注册复用

为避免工具注册代码在 `packages/mcp-server` 和主应用之间重复维护，有两种策略：

| 策略 | 做法 | 复杂度 | 推荐 |
|------|------|--------|------|
| **A. 直接引用构建产物** | 主应用 import `packages/mcp-server/dist/index.mjs` | 低 | ⭐ 建议 Phase 1 采用 |
| **B. 抽取共享层** | 将工具注册函数提取为共享包 `@momei-blog/mcp-tools` | 中高 | Phase 2 可选增强 |

**Phase 1 推荐策略 A**：主应用通过 workspace 协议引用 `momei-mcp-server` 包，直接复用其工具注册函数：

```typescript
// server/plugins/mcp-http.ts
import { registerPostTools, registerTaxonomyTools, /* ... */ } from 'momei-mcp-server/tools'
```

> 注意：`packages/mcp-server` 当前使用 `tsdown` 构建为 ESM，需确认 `exports` 映射中是否包含 `tools/` 子路径。若包含，可直接引用；若不包含，需先补全子路径导出映射。

### 4.5 生命周期管理

| 事件 | 行为 |
|------|------|
| **Nitro 启动** | 条件判断 → 动态导入 → 创建 McpServer → 注册工具 → 连接 Transport → 注册路由 |
| **请求到来** | 鉴权 → 路由到 transport.handleRequest() → 返回 SSE/JSON 响应 |
| **Nitro 关闭** | 调用 `server.close()` 关闭 MCP 连接，释放资源 |
| **启动失败** | 捕获异常，日志记录错误，不阻塞主应用启动 |

## 5. 安全架构 (Security)

### 5.1 认证

- 复用现有外部 API Key 机制（`X-API-Key` 请求头）
- 与 `server/api/external/*` 共用同一鉴权中间件
- 缺失或无效的 API Key 返回 `401 Unauthorized`

### 5.2 授权

- 危险工具开关 `MOMEI_ENABLE_DANGEROUS_TOOLS` 对 HTTP 模式同样生效
- 未启用时，delete 类工具不注册，HTTP 调用也无法绕过

### 5.3 速率限制

- 复用 `NUXT_RATE_LIMIT_EXTERNAL_*` 配置
- MCP HTTP 调用计入外部 API 速率限制额度

### 5.4 网络防护

- 监听主应用已有端口（不新增端口暴露面）
- 默认绑定与主应用相同的 host 策略（开发环境 localhost，生产环境受 Vercel/反向代理保护）
- CORS 策略继承主应用配置

### 5.5 危险操作保护

| 防护层 | 说明 |
|--------|------|
| 编译时 | `MOMEI_ENABLE_DANGEROUS_TOOLS=false` 时 delete 工具不注册 |
| 请求时 | 即使注册，API Key 权限不足也无法调用 |
| 审计 | 所有 MCP 操作与外部 API 共用审计日志 |

## 6. Serverless 兼容性 (Serverless Compatibility)

### 6.1 限制说明

Streamable HTTP 依赖 SSE (Server-Sent Events) 实现服务端推送。在 Serverless 环境中：
- **Vercel Serverless Functions**: 无长期连接支持，SSE 流可能被截断或超时
- **Cloudflare Workers**: 不原生支持 SSE 流维持
- **Docker / VPS 自部署**: ✅ 完全支持

### 6.2 静默降级策略

```typescript
// 判断是否处于 Serverless 环境
function isServerlessSseCapable(): boolean {
    // Vercel 和 Cloudflare 环境不适合 SSE 长连接
    if (process.env.VERCEL === '1') return false
    if (process.env.CF_PAGES === '1') return false
    if (process.env.CF_WORKER === '1') return false
    return true
}
```

在不可用环境下：
- MCP HTTP 端点不注册
- 日志输出 `[MCP-HTTP] Skipped: SSE not supported in serverless environment`
- 不阻塞主应用启动，不报错
- AI 客户端回退使用 stdio 模式（本地）或 NPM 包引用

### 6.3 部署配置建议

| 部署环境 | MCP HTTP 支持 | 推荐配置 |
|---------|---------------|---------|
| Docker / VPS | ✅ 完全支持 | 设置 `MOMEI_ENABLE_MCP_HTTP=true` |
| Vercel | ❌ 静默降级 | 保持默认 `false`，使用独立 stdio |
| Cloudflare | ❌ 静默降级 | 保持默认 `false`，使用独立 stdio |
| 本地开发 | ✅ 完全支持 | 设置 `MOMEI_ENABLE_MCP_HTTP=true` |

## 7. 工具清单 (Tools)

HTTP 模式下暴露的工具体系与 stdio 模式完全一致，共享同一套注册代码。当前 `33` 个工具按功能组划分：

| 功能组 | 工具数量 | 说明 |
|--------|---------|------|
| 文章管理 | 8 | list / get / create / update / publish / versions / delete* / sync_views |
| 分类管理 | 4 | list / create / update / delete* |
| 标签管理 | 4 | list / create / update / delete* |
| 灵感碎片管理 | 6 | list / get / create / update / convert / delete* |
| AI 自动化 | 7 | suggest_titles / recommend_tags / recommend_categories / translate_post / generate_cover_image / generate_post_audio / get_ai_task |
| 导入与治理 | 4 | validate_import_post / dry_run_link_governance / apply_link_governance / get_link_governance_report |

> *标记为危险工具，需 `MOMEI_ENABLE_DANGEROUS_TOOLS=true` 启用

## 8. 依赖变更 (Dependencies)

### 根 package.json 新增依赖

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.29.0"
  }
}
```

> **理由**: 该依赖通过 Nitro Plugin 中的 `await import()` 动态引入，仅在 `MOMEI_ENABLE_MCP_HTTP=true` 时加载。默认状态下不增加冷启动负载和构建体积。

### packages/mcp-server/package.json 不变

`packages/mcp-server` 作为独立包继续保留，其 `@modelcontextprotocol/sdk` 依赖不受影响。

## 9. 实现路径 (Implementation Roadmap)

### Phase 1：核心集成（~5h）

| 步骤 | 内容 | 估时 |
|------|------|------|
| 1.1 | 新增环境变量 `MOMEI_ENABLE_MCP_HTTP` 并注册到配置文档 | 0.5h |
| 1.2 | 创建 `server/plugins/mcp-http.ts`：条件守卫 + 动态导入 | 1h |
| 1.3 | 集成 `StreamableHTTPServerTransport` + 路由分发 | 2h |
| 1.4 | 复用 API Key 鉴权中间件 + CORS 适配 | 0.5h |
| 1.5 | 工具注册（复用 `packages/mcp-server` 注册函数，补齐子路径导出） | 0.5h |
| 1.6 | 新增 `@modelcontextprotocol/sdk` 根依赖 + `pnpm install` | 0.5h |
| | **小计** | **5h** |

### Phase 2：增强与测试（~3h）

| 步骤 | 内容 | 估时 |
|------|------|------|
| 2.1 | 集成测试（HTTP 端点调用测试） | 1.5h |
| 2.2 | Serverless 静默降级逻辑 + 日志 | 0.5h |
| 2.3 | 速率限制集成 + 危险操作验证 | 0.5h |
| 2.4 | 文档更新（README、`.env.example`、MCP 设计文档） | 0.5h |
| | **小计** | **3h** |

### Phase 3：可选增强（视需求决定）

| 步骤 | 内容 | 估时 |
|------|------|------|
| 3.1 | 共享层抽取（将 `packages/mcp-server` 的工具注册和 API 封装提取为独立共享包） | 2h |
| 3.2 | 无状态模式支持（Serverless 友好） | 1h |
| 3.3 | 健康检查端点 `GET /api/mcp/health` | 0.5h |

## 10. 风险与缓解 (Risks & Mitigations)

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| Nitro 中 h3 请求/响应与 HTTP Transport 的兼容问题 | 中 | 中 | 保留备选 Web Standard Transport；测试阶段在本地 Docker 和 VPS 环境验证 |
| Serverless SSE 限制导致功能不可用 | 低（静默降级） | 高 | 已设计静默降级策略，不影响主应用；文档明确标注适用环境 |
| 动态导入在 Nitro 打包时被 tree-shake | 中 | 低 | 使用 `await import()` 确保运行时解析；在 `nitro.externals` 中排除以防构建时被优化掉 |
| API Key 复用导致鉴权冲突 | 低 | 低 | `/api/mcp` 与 `/api/external/*` 共用相同 Key 体系，鉴权中间件路径匹配前缀即可 |
| 工具注册代码双重维护 | 中 | 低 | Phase 1 直接引用 `packages/mcp-server` 的注册函数，不复制代码；后续通过共享层治理 |

## 11. 相关文档 (Related Docs)

- [MCP 服务器设计](./mcp.md) — 现有 MCP stdio 服务器设计
- [CLI/MCP 自动化能力扩展设计](../governance/cli-mcp-automation.md) — 外部契约与能力分层
- [CLI/MCP API 客户端复用治理](../governance/cli-mcp-api-client-reuse.md) — API Client 共享治理
- [任务调度器插件](../../server/plugins/task-scheduler.ts) — 条件启停 + 动态导入参考实现
- [MCP SDK Streamable HTTP 规范](https://github.com/modelcontextprotocol/specification/blob/main/README.md) — 官方协议规范

---

> **设计状态**: 已确认（决策完毕，待上收实现）
> **关联包**: `packages/mcp-server` + `server/plugins/mcp-http.ts`
> **依赖**: `@modelcontextprotocol/sdk@^1.29.0`
