# TTS 前端直出评估与原型设计 (TTS Frontend Direct Evaluation & Prototype Design)

## 1. 概述

### 1.1 问题定义

当前 TTS（文本转语音）链路为 **全服务端模式**：

```
前端触发 → 服务端调用 Provider API → 流式读取 → Buffer 拼接 → 服务端上传 OSS → 回写 Post 元数据
```

在 Vercel 云函数环境下，存在 **硬超时限制**（`nuxt.config.ts` 中 `maxDuration: 60s`），长文章 TTS 生成远超此限制。现有 `media-task-monitor` 补偿机制依赖 Vercel Cron（每 2h 执行）或用户手动轮询触发恢复，体验较差。

### 1.2 目标方案

将 TTS 音频生成迁移到 **浏览器端**，利用浏览器无超时限制的优势。采用火山引擎 **JWT Token 临时鉴权方案**（方案一）。HTTP speech 模式通过 `X-Api-Access-Key: Jwt; jwt_token` header 鉴权（WebSocket 播客模式预留 URL Query 方式）。

```
浏览器获取 JWT 凭证 → 直调火山 TTS API（`X-Api-Access-Key` header）→ 接收音频 → 直传 OSS（复用预签名 URL）→ 回调服务端写元数据
```

### 1.3 本文档定位

本文档为 **评估 + 原型设计** 文档，不承诺进入完整生产实现。原型目标：

- 完成 Provider CORS 兼容性评估（确认仅火山引擎可行）
- 设计 API Key 安全方案（火山 JWT Token 方案一）
- 设计并落地火山引擎 JWT 直连最小闭环原型
- 明确后续进入完整实现的准入条件与阻塞项

## 2. Provider CORS 兼容性评估

### 2.1 评估矩阵

| Provider | 端点 | CORS 支持 | 流式响应 | 浏览器直连可行性 | 结论 |
|----------|------|----------|---------|-----------------|------|
| **OpenAI** | `https://api.openai.com/v1/audio/speech` | ❌ 不设置 `Access-Control-Allow-Origin` | ✅ `Transfer-Encoding: chunked` | ❌ 不可直连 | 需服务端代理 |
| **SiliconFlow** | `https://api.siliconflow.cn/v1/audio/speech` | ❌ 不设置 `Access-Control-Allow-Origin` | ✅ 同 OpenAI 兼容 | ❌ 不可直连 | 需服务端代理 |
| **Volcengine** | `https://openspeech.bytedance.com/api/v1/tts` | ❌ 不设置 CORS 头 | ✅ 流式 + WebSocket (播客) | ❌ 不可直连 | 需服务端代理；播客 WebSocket 更复杂 |

### 2.2 详细评估

#### OpenAI (`api.openai.com`)

- **API 端点**: `POST /v1/audio/speech`（当前代码: `server/utils/ai/tts-openai.ts`）
- **鉴权方式**: `Authorization: Bearer {apiKey}`
- **CORS 状态**: OpenAI API 不向浏览器端发送 `Access-Control-Allow-Origin` 响应头。从浏览器发起的 `fetch()` 请求会触发 CORS preflight，被浏览器拦截。
- **流式响应**: 支持，响应体为 `Transfer-Encoding: chunked` 的 MP3 字节流。
- **结论**: 无法从浏览器直连，必须通过服务端代理转发。

#### SiliconFlow (`api.siliconflow.cn`)

- **API 端点**: `POST /v1/audio/speech`（当前代码: `server/utils/ai/tts-siliconflow.ts`）
- **鉴权方式**: `Authorization: Bearer {apiKey}`
- **CORS 状态**: 同为 OpenAI 兼容 API，不设置 CORS 响应头。与 OpenAI 同等限制。
- **流式响应**: 支持（OpenAI 兼容格式）。
- **结论**: 无法从浏览器直连，必须通过服务端代理转发。

#### Volcengine / 火山引擎 (`openspeech.bytedance.com`)

- **API 端点**: 
  - Speech: `POST /api/v1/tts`（当前代码: `server/utils/ai/tts-volcengine.ts` L798）
  - Podcast: `wss://openspeech.bytedance.com/api/v3/sami/podcasttts`（WebSocket 双人对话模式）
- **鉴权方式**: HMAC-SHA256 Token 签名（需 `AppId` + `AccessKey` + `SecretKey`），无法在浏览器端安全计算。
- **CORS 状态**: 不设置 CORS 响应头。
- **流式响应**: Speech 模式支持 HTTP 流式；Podcast 模式使用 WebSocket（Seed-TTS 2.0 协议）。
- **结论**: 浏览器直连不可行。签名计算需要 SecretKey，无法安全暴露到前端。Podcast 的 WebSocket 协议复杂，前端直连需完整实现握手、分片、断线重连与签名更新逻辑。

### 2.3 CORS 评估结论

**全部三个主流 Provider 均不支持浏览器端 CORS 直连。** 前端直出方案必须依赖 **服务端代理转发** 架构。不存在"纯前端直调 Provider API"的可行路径。

## 3. API Key 安全方案设计

### 3.1 安全约束

- TTS Provider 的 API Key **绝不能** 暴露到浏览器端（网络面板、JS 运行时内存均不可见明文 Key）
- 自部署用户可以在 `NUXT_TTS_API_KEY` 等环境变量中配置自己的 API Key，仍由服务端持有
- 前端应通过 **会话鉴权**（Better-Auth Session Cookie）证明身份，而非 API Key

### 3.2 方案对比

| 方案 | 描述 | API Key 暴露 | 实现复杂度 | Vercel 超时影响 | 推荐 |
|------|------|-------------|-----------|----------------|------|
| **A. 短期 Token 下发** | 服务端生成一个短期（5min）加密 Token，前端携带 Token 直调 Provider | 不暴露（Token 非原始 Key） | 中 | Provider 侧仍需 CORS 支持 → 不可行 | ❌ |
| **B. 服务端流式代理** | 服务端提供 `/api/ai/tts/stream-proxy` 端点，验证 Session → 转发 Provider → 流式透传响应 | 不暴露 | 低 | 代理端点本身受 Vercel 60s 限制 → 长文章仍超时 | ⚠️ 原型可用 |
| **C. Edge 代理层** | 在 Cloudflare Workers 或类似 Edge 平台上部署独立代理，绕过 Vercel Serverless 限制 | 不暴露 | 高 | ✅ Edge Workers 无 60s 硬限 | ⭐ 生产推荐 |
| **D. 混合方案** | 短文本 (< 60s) 走方案 B（Vercel 代理），长文本降级走方案 A 或原有服务端模式 | 不暴露 | 中 | 短文本不受影响 | ⚠️ |

### 3.3 原型采用方案：方案 B（服务端流式代理）

理由：
1. 实现成本最低，复用现有 Nitro server routes 基础设施
2. 满足原型验证目标（证明"前端接流 → 拼接 → 直传 → 写元数据"闭环可行）
3. 原型阶段不追求全文本覆盖（短/中文本即可验证核心链路）
4. 与现有 `TTSService` 配合：代理端点直接调用已有的 Provider 适配层（`generateSpeech()`），不改写 Provider 逻辑

### 3.4 安全设计要点

```
┌──────────┐     GET /api/ai/tts/stream-proxy     ┌──────────────┐     POST /v1/audio/speech    ┌────────────┐
│  Browser │ ──▶   ?text=...&voice=...&mode=...   │  Nitro Route │ ──▶  Bearer {apiKey}         │  Provider  │
│ (Session │     (Session Cookie 携带鉴权)          │  (服务端)     │ ◀── ReadableStream           │  API       │
│  Cookie) │ ◀── ReadableStream (audio/mpeg)       │              │                              │            │
└──────────┘                                       └──────────────┘                              └────────────┘
```

**鉴权链路**:
1. 浏览器请求携带 Better-Auth Session Cookie → Nitro 端 `requireAuth(event)` 验证
2. 服务端从设置中读取 Provider API Key → 服务端内存持有，不返回前端
3. 服务端调用 Provider → 流式透传响应体 → 不缓冲完整音频（减少内存占用）

**安全边界**:
- API Key 仅存在于服务端进程内存
- 前端只需有效 Session Cookie（同现有 admin/author 页面鉴权）
- 代理端点仅透传 HTTP 响应体，不解析或存储音频内容

## 4. 原型架构设计

### 4.1 端到端闭环

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                              浏览器端 (Browser)                                │
│                                                                               │
│  ┌──────────────┐    ┌───────────────┐    ┌──────────────┐    ┌────────────┐ │
│  │ TTS Dialog   │───▶│ useTtsDirect  │───▶│ useUpload    │───▶│ Metadata   │ │
│  │ (UI 触发)     │    │ (流式接收+拼接) │    │ (直传 OSS)    │    │ API 回写    │ │
│  └──────────────┘    └───────┬───────┘    └──────┬───────┘    └─────┬──────┘ │
│                              │                   │                  │        │
└──────────────────────────────┼───────────────────┼──────────────────┼────────┘
                               │                   │                  │
                    ┌──────────▼──────────┐ ┌──────▼───────┐ ┌──────▼───────┐
                    │ GET /api/ai/tts/    │ │ POST /api/   │ │ PATCH /api/  │
                    │   stream-proxy      │ │   upload/    │ │   posts/[id]/ │
                    │                     │ │   direct-auth│ │   tts-metadata│
                    └──────────┬──────────┘ └──────┬───────┘ └──────┬───────┘
                               │                   │                  │
┌──────────────────────────────┼───────────────────┼──────────────────┼────────┐
│                           服务端 (Nitro Server)                       │        │
│                    ┌────────▼────────┐  ┌───────▼──────┐  ┌───────▼──────┐ │
│                    │ TTSService      │  │ direct-upload│  │ Post Repo    │ │
│                    │ .generateSpeech │  │ .authorize   │  │ .save()      │ │
│                    └────────┬────────┘  └──────────────┘  └──────────────┘ │
│                             │                                              │
└─────────────────────────────┼──────────────────────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  TTS Provider API   │
                    │  (OpenAI/SF/Volc)   │
                    └────────────────────┘
```

### 4.2 新增文件清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `server/utils/ai/tts-credentials.ts` | Service | 火山 JWT Token 生成（复用 ASR 凭证模式） |
| `server/api/ai/tts/credentials.post.ts` | API Route | `POST /api/ai/tts/credentials` — 为前端颁发临时 JWT |
| `composables/use-tts-volcengine-direct.ts` | Composable | 前端直连编排：JWT 鉴权 → 直调火山 API → 直传 OSS → 回写元数据 |
| `server/api/posts/[id]/tts-metadata.patch.ts` | API Route | 回写 Post TTS 元数据（audioUrl, provider, voice 等） |
| `components/admin/posts/post-tts-prototype.vue` | Component | 原型 UI 组件（仅火山引擎，独立于现有 `post-tts-dialog.vue`） |

### 4.3 不变更文件

| 文件 | 原因 |
|------|------|
| `server/services/ai/tts.ts` (`TTSService`) | 原型不重写服务端核心逻辑 |
| `server/utils/ai/tts-volcengine.ts` (Provider 适配层) | 不改动 Provider 实现 |
| `components/admin/posts/post-tts-dialog.vue` | 原型独立组件，不污染现有生产 UI |
| `composables/use-tts-task.ts` | 原 polling 流程保持不变 |
| `server/services/direct-upload.ts` | 直接复用现有 `authorizeDirectUpload()` |
| `composables/use-upload.ts` | 直接复用现有 `uploadFile()` |

### 4.4 凭证颁发端点设计

```typescript
// POST /api/ai/tts/credentials
// Body: { provider: 'volcengine', mode: 'speech' }
export default defineEventHandler(async (event) => {
    const body = await readValidatedBody(event, RequestSchema.parse)
    const settings = await getSettings([...])
    
    const credentials = await generateTTSCredentials({
        provider: 'volcengine',
        mode: body.mode,
        settings,
        expiresIn: resolveTTSCredentialTtlMilliseconds(...),
    })
    
    return { code: 200, data: credentials }
})
```

### 4.5 前端直连与直传逻辑

```typescript
// composables/use-tts-volcengine-direct.ts (核心流程)
async function generateAndUpload(params: TTSVolcengineDirectParams) {
    // 1. 获取 JWT 凭证
    const credentials = await fetchCredentials('speech')
    
    // 2. 直调火山 TTS API（Header 鉴权: X-Api-Access-Key: Jwt; ...）
    const response = await fetch(credentials.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Api-App-Id': credentials.appId,
            'X-Api-Access-Key': `Jwt; ${credentials.jwtToken}`,
            'X-Api-Resource-Id': credentials.resourceId,
            'X-Api-Request-Id': crypto.randomUUID(),
            Connection: 'keep-alive',
        },
        body: JSON.stringify(requestBody),
    })
    const audioBytes = await parseVolcengineResponse(response)
    
    // 3. 直传 OSS（复用现有 useUpload / pre-signed URL）
    // 4. 回写元数据
}
```

### 4.6 元数据回写端点设计

```typescript
// PATCH /api/posts/[id]/tts-metadata
export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)
    const postId = getRouterParam(event, 'id')
    const body = await readBody(event) // { audioUrl, provider, voice, mode, duration }
    
    // 权限检查 + 写入 Post.metadata.audio / Post.metadata.tts
    const post = await postRepo.findOneBy({ id: postId })
    // ... 与现有 processTask() 中的 metadata patch 逻辑对齐
    
    return success({ updated: true })
})
```

## 5. 原型实现约束与边界

### 5.1 原型范围

- ✅ 服务端流式代理端点（复用现有 `TTSService.generateSpeech()`）
- ✅ 前端流式接收 + 拼接 Blob（含进度展示）
- ✅ 前端直传 OSS（复用现有 `useUpload` / pre-signed URL）
- ✅ 元数据回写 API
- ✅ 一个独立的原型 UI 组件（不替换现有 dialog）
- ✅ 支持 speech 模式（OpenAI / SiliconFlow）
- ✅ 支持 podcast 模式（如有 Provider 支持）

### 5.2 非原型范围

- ❌ 不重写 `TTSService.processTask()`（保留原始服务端链路）
- ❌ 不动 `media-task-monitor` 补偿逻辑
- ❌ 不扩展到 AI Image 或其他媒体类型
- ❌ 不修改现有 `post-tts-dialog.vue`
- ❌ 不处理 Volcengine WebSocket 播客模式（复杂度太高，另作专项评估）
- ❌ 不做生产级错误处理与重试策略

### 5.3 已知限制

| 限制 | 原因 | 影响 | 缓解措施 |
|------|------|------|---------|
| Vercel 60s 硬超时仍存在 | 代理端点在 Vercel Serverless 函数中运行 | 超长文本 (> 约 3000 字) 仍会超时 | 原型仅覆盖短/中文本；生产方案推荐 Edge Workers |
| 服务端内存占用 | 代理端点透传时不缓冲，但 Vercel Lambda 有 1GB 内存限制 | 极长音频可能 OOM | `ReadableStream` 透传模式不缓冲完整音频 |
| Volcengine 播客不支持 | 播客需要 WebSocket + 复杂签名 | 播客用户仍需走原始服务端链路 | 原型仅覆盖 HTTP 流式 speech 模式 |
| 无断点续传 | 浏览器端无断点续传机制 | 网络中断后需重新开始 | 生产方案可引入分片上传 + Range 请求 |

## 6. 生产方案推荐

### 6.1 长期推荐架构：Cloudflare Workers 代理层

```
Browser ──▶ CF Worker (/tts-proxy) ──▶ TTS Provider API
                │ (持有 API Key, 添加 CORS)
                │ (无 Serverless 60s 硬限)
                │ (全球边缘节点，低延迟)
```

**优势**:
- Cloudflare Workers 的 CPU 时间限制为 30s（付费）或 10ms（免费），但对于流式透传（大部分时间在等待 I/O），实际受限较小
- Workers 可从环境变量安全读取 API Key
- 可配置 CORS 头允许指定来源
- 全球 CDN 节点，低延迟

**劣势**:
- 需要额外维护一个 Worker 部署
- Worker 有 128MB 内存限制（不适合缓冲大文件，但透传模式足够）
- 对自部署用户增加了部署复杂度

### 6.2 中期方案：Vercel Edge Functions

Vercel Edge Functions 没有 60s 硬限制（但有不同的执行模型限制），可作为 Vercel 部署用户的代理层。

### 6.3 短期（原型阶段后）：保留双模式

- **Serverless 场景**: 前端直出模式（本原型验证的链路）
- **自部署 / Docker 场景**: 保留现有服务端 `TTSService.processTask()` 完整链路

## 7. 验收标准

- [x] Provider CORS 评估文档已产出（本文档 Section 2）
- [x] API Key 安全方案已设计（本文档 Section 3）
- [ ] 服务端流式代理端点已实现并通过 curl 验证
- [ ] 前端流式接收 + 拼接 + 直传 OSS 原型已跑通
- [ ] 元数据回写端点已实现并验证 Post 字段正确更新
- [ ] 原型 UI 组件可独立触发端到端流程
- [ ] 原型证据（截图/录屏）已产出并回链到阶段回归记录

## 8. 相关文档

- [ASR 性能与体验优化](./asr-performance-optimization.md) — 复用其"前端直连凭证"设计思路
- [TTS 凭证生成工具](../../server/utils/ai/tts-credentials.ts)
- [TTS 凭证颁发端点](../../server/api/ai/tts/credentials.post.ts)
- [use-tts-volcengine-direct Composable](../../composables/use-tts-volcengine-direct.ts)
- [Post TTS 元数据回写 API](../../server/api/posts/[id]/tts-metadata.patch.ts)
- [待办事项](../../plan/todo.md) — 第三十四阶段
- [积压项 #13](../../plan/backlog.md)
