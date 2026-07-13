# AI 辅助功能模块 (AI Integration Module)

## 1. 概述 (Overview)

本模块旨在通过集成先进的大语言模型 (LLM) 和翻译 API，为博主提供内容创作和管理方面的智能辅助。核心目标是提高创作效率、优化内容质量以及加速国际化流程。

## 2. 核心功能设计 (Core Features)

### 2.1 创作辅助 (Writing Assistant)

-   **智能标题建议 (Title Suggestions)**: 根据正文内容自动生成 5-10 个吸引人的标题。
-   **自动摘要生成 (Auto Summary)**: 提取正文精华，生成适合 SEO 的摘要和描述。
-   **标签推荐 (Tag Recommendations)**: 分析文章关键词，自动推荐或匹配现有的标签。
-   **字数与阅读时长预估**: (已在 MVP 完成，后续可结合 AI 进行质量评估)。

### 2.2 翻译辅助 (Translation Assistant)

-   **一键内容翻译 (One-click Translation)**:
    -   基于当前的 `translationId` 体系，一键将文章内容翻译为目标语言（如中译英、英译中）。
    -   支持 Markdown 格式锁定：确保翻译过程中公式、代码块、链接等非文本部分不被篡改。
-   **元数据同步**: 翻译时同步分类映射和标签对照。

### 2.3 内容生成与校验 (Gen & Check) - 后续规划

-   **大纲推荐**: 根据标题或简单描述生成文章大纲。
-   **语法检查与润色**: 针对多语言创作进行拼写纠错和风格润色。

## 3. 技术方案 (Technical Scheme)

### 3.1 服务端架构

-   **统一适配器系统 (Unified Adapter System)**: 封装统一的 `AIProvider` 接口，解耦厂商差异。
    -   **OpenAI Provider**: 兼容标准 OpenAI 协议，通过 `AI_API_ENDPOINT` 完美适配 DeepSeek、Azure OpenAI 及 OneAPI 等。
    -   **Anthropic Provider**: 原生支持 Claude 系列模型。
-   **Prompt 模板系统 (Prompt Utilities)**: 采用“约定优于配置”策略。目前通过 `server/utils/ai/prompt.ts` 集中管理常用的 Prompt 模板与变量注入逻辑，后续可根据业务需求扩展为动态加载。
-   **安全与合规管理**:
    -   **频率限制 (Rate Limiting)**: (迁移至业务层实现) 针对不同角色的用户设定差异化的 AI 调用频率上限。
    -   **Token 追溯**: (可选) 记录请求与响应的 Token 消耗，用于成本核算。
-   **流式响应 (SSE)**: (增强阶段) 针对长文本任务，提供流式实时反馈。

### 3.2 成本治理与审计演进

随着 AI 图像、ASR 与 TTS 等高成本能力接入，AI 模块的治理重点已经从“是否启用 AI”扩展为“如何统一计量不同任务的成本与额度”。

当前设计约束如下：

- 继续以 `AITask` 作为统一审计事实来源。
- 将“货币成本”和“配额额度”拆开处理，避免直接把厂商单价映射为用户额度。
- 第一阶段优先落地终态结算与失败归因，不引入复杂的预扣费与退款流水。

详细方案请参考 [AI 成本治理与多用户配额](../governance/ai-cost-governance.md)。

### 3.3 DeepSeek `user_id` 分组隔离约定

为对齐 DeepSeek 官方“同账号下按业务用户隔离调度与 KVCache”的能力，文本类 AI 请求统一遵循以下约定：

- 后端会把当前业务用户 ID 透传给上游模型提供商：
    - OpenAI 兼容链路（含 DeepSeek）：请求体字段为 `user_id`
    - Anthropic 链路：请求体字段为 `metadata.user_id`
- `user_id` 透传前会做格式校验：必须匹配正则 `[a-zA-Z0-9\-_]+` 且长度不超过 `512`。
- 当用户标识不满足上游约束时，后端会降级为“不传 `user_id`”，避免请求直接被上游拒绝。

说明：

- 项目当前把业务用户主键作为 `user_id` 透传来源，不允许拼接邮箱、手机号等隐私信息。
- 并发限速口径仍以 DeepSeek 账号总配额为主；`user_id` 主要用于上游内容安全、KVCache 与调度隔离。

### 3.4 环境变量配置

```bash
# 是否启用 AI
AI_ENABLED=false
# AI 服务提供商 (openai, anthropic)
AI_PROVIDER=openai
# API 密钥
AI_API_KEY=
# 默认模型名称 (如 gpt-4o, claude-3-5-sonnet, deepseek-chat)
AI_MODEL=gpt-4o
# API 端点 (可选，用于 OpenAI 兼容服务)
AI_API_ENDPOINT=https://api.openai.com/v1
# 最大生成 Token 数
AI_MAX_TOKENS=2048
# 温度 (0-2)
AI_TEMPERATURE=0.7
```

## 4. 接口设计 (API Design)

### 4.1 AI 核心接口 (`/api/ai/*`)

所有 AI 接口均需经 `admin` 或 `author` 权限验证。

同时，所有文本类 AI 调用默认携带经过校验的业务用户 `user_id` 到上游提供商（见 3.3 节）。

-   `POST /api/ai/suggest-titles`:
    -   输入: `{ content: string }`
    -   输出: `{ data: string[] }`
-   `POST /api/ai/suggest-slug`:
    -   输入: `{ title: string }`
    -   输出: `{ data: string }`
-   `POST /api/ai/translate`:
    -   输入: `{ text: string, targetLanguage: string, stream?: boolean }`
    -   输出: `{ data: string }`
-   `POST /api/ai/summarize`:
    -   输入: `{ text: string, maxLength?: number }`
    -   输出: `{ data: string }`
-   `POST /api/ai/recommend-tags`:
    -   输入: `{ content: string }`
    -   输出: `{ data: string[] }`

## 5. 交互设计 (Interaction Design)

#### 5.1 智能标题建议 (AI Title Suggestions)

-   **位置**: 文章编辑页标题输入框右侧。
-   **组件**: 按钮图标为 `pi pi-sparkles`。
-   **流程**:
    1. 用户点击按钮。
    2. 后端基于当前编辑器文本生成 5 个候选标题。
    3. 前端弹出 `OverlayPanel` (PrimeVue) 显示列表。
    4. 用户点击某个建议，标题即刻替换；支持撤销。

#### 5.2 自动摘要生成 (AI Summary Generation)

-   **位置**: 设置侧边栏 (Drawer) 中的摘要文本框下方。
-   **组件**: 文字链接或带图标的小按钮。
-   **流程**:
    1. 点击“AI 生成摘要”。
    2. 文本框进入 `loading` 状态（遮罩或动画）。
    3. 摘要生成后填入文本框。

#### 5.3 智能标签推荐 (AI Tag Recommendations)

-   **位置**: 设置侧边栏标签选择器附近。
-   **流程**:
    1. 点击“推荐标签”。
    2. 后端分析正文并匹配现有标签库或生成新关键词。
    3. 以 `Chip` 形式展示，点击加号 (`+`) 添加到文章。

#### 5.4 一键全文翻译 (AI Translation)

-   **位置**: 编辑器顶栏或设置侧边栏语言选项旁。
-   **流程**:
    1. 用户选择目标语言。
    2. 弹窗二次确认（防止误操作覆盖内容）。
    3. 翻译后，内容在编辑器中渐进式更新（或一键应用）。

## 6. 开发规范 (Development Standards)

-   **安全性**: 必须校验管理员权限。
-   **限流**: 默认每分钟限制 10 次请求 (Rate Limit)。
-   **反馈**: 所有 AI 操作必须有明确的 Loading 状态。
-   **错误处理**: API Key 失效、网络超时、Token 溢出均需友好提示。

## 7. Volcengine 配置约定（语音能力）

-   为降低部署复杂度，Volcengine 语音能力（ASR/TTS）默认共用一套凭据：`VOLCENGINE_APP_ID`、`VOLCENGINE_ACCESS_KEY`（可选 `VOLCENGINE_SECRET_KEY`）。
-   ASR 专属参数通过 `ASR_MODEL`、`ASR_ENDPOINT` 控制；TTS 专属参数通过 `TTS_DEFAULT_MODEL` 控制。
-   不再推荐为 ASR 与 TTS 分别维护两套火山凭据，避免配置漂移与排障成本上升。

## 8. AI 提供商降级与容错设计 (AI Provider Fallback & Fault Tolerance)

### 8.1 背景与目标

在生产环境中，单一 AI 提供商可能出现网络波动、速率限制（429）、服务不可用或 API Key 额度耗尽等情况。为保证核心 AI 功能的持续可用，Phase 55 引入了自动降级容错机制，允许为文本与图像两类 AI 能力分别配置备用提供商，在主提供商失败时无缝切换。

### 8.2 架构总览

降级容错由三层组成：

1. **配置层**：通过 `SettingKey` 定义主/备提供商的独立配置（Provider、API Key、Model、Endpoint），支持 text / image 两类分别配置。
2. **编排层**：`getAIProviderWithFallback` / `getAIImageProviderWithFallback` 负责读取备配置、构建主备 Provider 实例、组装 `FallbackAIProvider` 包装器。
3. **执行层**：`FallbackAIProvider` 实现 `AIProvider` 接口，透明拦截 `chat()` / `generateImage()` 调用，自动执行"主→重试→降级→备→结果/报错"流程。

```
                    ┌─────────────────────┐
                    │   Service Layer     │
                    │ (TextService /       │
                    │  ImageService)       │
                    └──────┬──────────────┘
                           │ getAIProviderWithFallback(category)
                           ▼
                    ┌─────────────────────┐
                    │ FallbackAIProvider   │
                    │  ┌───────────────┐  │
                    │  │  Primary       │  │  ← OpenAI / Anthropic / Gemini 等
                    │  │  Provider      │  │
                    │  └───────┬───────┘  │
                    │          │ 失败时    │
                    │          ▼          │
                    │  ┌───────────────┐  │
                    │  │  Fallback     │  │  ← 独立配置的备用提供商
                    │  │  Provider     │  │
                    │  └───────────────┘  │
                    └─────────────────────┘
```

### 8.3 配置定义 (`SettingKey`)

文本类与图像类均有独立的 Fallback 配置，以 `_FALLBACK_` 后缀区分。

**文本类 Fallback 设置键：**

| SettingKey | 类型 | 说明 |
|---|---|---|
| `AI_FALLBACK_PROVIDER` | `AdminAIProvider` | 备用提供商类型（`openai` / `anthropic` / `google` 等） |
| `AI_FALLBACK_API_KEY` | `string` | 备用 API Key |
| `AI_FALLBACK_MODEL` | `string` | 备用模型名称 |
| `AI_FALLBACK_ENDPOINT` | `string` | 备用 API 端点 |

**图像类 Fallback 设置键：**

| SettingKey | 类型 | 说明 |
|---|---|---|
| `AI_IMAGE_FALLBACK_PROVIDER` | `AdminAIImageProvider` | 备用提供商类型（`openai` / `gemini` / `stable-diffusion` 等） |
| `AI_IMAGE_FALLBACK_API_KEY` | `string` | 备用 API Key |
| `AI_IMAGE_FALLBACK_MODEL` | `string` | 备用模型名称 |
| `AI_IMAGE_FALLBACK_ENDPOINT` | `string` | 备用 API 端点 |

**类型定义：**

```typescript
// types/setting.ts
export interface AISettingsFields {
    // ... 主配置
    ai_fallback_provider: AdminAIProvider | null
    ai_fallback_api_key: string | null
    ai_fallback_model: string | null
    ai_fallback_endpoint: string | null
    ai_image_fallback_provider: AdminAIImageProvider | null
    ai_image_fallback_api_key: string | null
    ai_image_fallback_model: string | null
    ai_image_fallback_endpoint: string | null
}
```

### 8.4 编排 API (`getAIProviderWithFallback` / `getAIImageProviderWithFallback`)

**函数签名：**

```typescript
// server/utils/ai/index.ts

/**
 * 获取带有自动降级能力的 AI Provider。
 * 当主提供商失败时，自动切换至备用提供商重试。
 * 降级事件会记录到日志和可选的监控指标中。
 */
export async function getAIProviderWithFallback(
    category: 'text' | 'image',
): Promise<AIProvider>

/**
 * 获取带有自动降级能力的图片生成提供者（快捷方式）
 */
export async function getAIImageProviderWithFallback(): Promise<AIProvider>
```

**行为规则：**

1. 首先调用 `getAIProvider(category)` 获取主 Provider。
2. 读取该类别对应的 `_FALLBACK_` 配置键：
   - 若 `fallbackProvider` 为空 → 不包装，直接返回主 Provider。
   - 若 `fallbackProvider` 与主 Provider 类型相同 → 不包装（避免自我降级）。
3. 构建 fallback `AIConfig`（优先使用独立 fallback 配置，若缺失则继承全局 AI fallback 配置）。
4. 调用 `createTextProvider` / `createImageProvider` 创建备用 Provider 实例。
5. 返回 `new FallbackAIProvider(primary, fallback, category)`。

**类别映射：**

| 类别 | 主配置键前缀 | Fallback 配置键前缀 |
|---|---|---|
| `text` | `AI_*` | `AI_FALLBACK_*` |
| `image` | `AI_IMAGE_*` | `AI_IMAGE_FALLBACK_*` |

ASR / TTS 类别暂不支持 fallback（无 `_FALLBACK_` 配置键定义）。

### 8.5 Fallback 执行流程

`FallbackAIProvider` 是一个透明包装器，实现 `AIProvider` 接口。核心逻辑位于 `withFallback<TResult>()` 私有方法。

```
┌─────────────────────────────────────────────────┐
│                 withFallback()                   │
├─────────────────────────────────────────────────┤
│  第一阶段：主 Provider + 重试                      │
│                                                    │
│  ┌─ for attempt = 1 to maxRetries ───────────┐   │
│  │  try { return await fn(primary) }         │   │
│  │  catch {                                  │   │
│  │    if (非可重试错误 401/403/404) → break   │   │
│  │    if (attempt < maxRetries)              │   │
│  │      logger.warn + sleep(1s) + retry      │   │
│  │  }                                        │   │
│  └───────────────────────────────────────────┘   │
│                                                    │
│  第二阶段：记录降级事件                               │
│  ┌─────────────────────────────────────────────┐ │
│  │  AIFallbackEvent = { timestamp, category,   │ │
│  │    primaryProvider, fallbackProvider,       │ │
│  │    operation, primaryError, retryCount }    │ │
│  │  logger.warn("[FallbackAI] Degrading ...")  │ │
│  └─────────────────────────────────────────────┘ │
│                                                    │
│  第三阶段：Fallback Provider                        │
│  ┌─────────────────────────────────────────────┐ │
│  │  try { return await fn(fallback) }          │ │
│  │  catch {                                    │ │
│  │    AIFallbackEvent.fallbackSuccess = false   │ │
│  │    logger.error(...)                        │ │
│  │    throw 综合错误 (主+备失败信息)             │ │
│  │  }                                          │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**详细步骤：**

1. **主 Provider 初始尝试**：调用 `fn(primary)` 执行目标操作。
2. **可重试判断**：若错误包含 `401`/`403`/`404`/`409` 等客户端错误标识，或匹配 `does not support` / `not configured` / `Unauthorized` 等模式，视为**非可重试错误**，跳过重试直接进入降级。
3. **重试**：默认最多 2 次尝试（1 次初始 + 1 次重试），间隔 1 秒。每次重试前输出 `logger.warn`。
4. **降级**：所有重试用尽或发生非可重试错误后，构建 `AIFallbackEvent` 记录，输出 `logger.warn` 降级日志。
5. **Fallback 执行**：调用 `fn(fallback)` 尝试备用提供商。
6. **结果处理**：
   - 成功 → 更新 `AIFallbackEvent.fallbackSuccess = true`，推入事件列表，输出 `logger.info`，返回结果。
   - 失败 → 更新 `AIFallbackEvent.fallbackSuccess = false` 并记录 fallback 错误信息，输出 `logger.error`，抛出综合异常（包含主备双方的错误详情）。

### 8.6 降级事件记录结构 (`AIFallbackEvent`)

```typescript
// server/utils/ai/fallback-provider.ts

export interface AIFallbackEvent {
    /** 事件发生时间 (ISO 8601) */
    timestamp: string
    /** 业务类别：文本类或图像类 */
    category: 'text' | 'image'
    /** 主提供商名称 */
    primaryProvider: string
    /** 备用提供商名称 */
    fallbackProvider: string
    /** 操作名称 (如 chat, generateImage) */
    operation: string
    /** 主提供商失败原因 */
    primaryError: string
    /** fallback 是否成功 */
    fallbackSuccess: boolean
    /** fallback 失败原因（可选） */
    fallbackError?: string
    /** 实际重试次数（不含首次） */
    retryCount: number
}
```

降级事件同时输出到日志系统（logger）并保留在 `FallbackAIProvider` 实例的事件列表中，可通过 `getFallbackEvents()` 获取，用于后续持久化到任务审计记录。

### 8.7 日志分级策略

| 日志级别 | 场景 | 示例消息 |
|---|---|---|
| `warn` | 主提供商失败，即将重试 | `[FallbackAI] Primary provider openai failed (attempt 1/2), retrying...` |
| `warn` | 主提供商耗尽，切换至备用 | `[FallbackAI] Degrading from openai to anthropic for chat` |
| `info` | Fallback 成功接管 | `[FallbackAI] Fallback successful: anthropic handled chat after openai failed` |
| `error` | 主备均失败 | `[FallbackAI] Both primary and fallback providers failed for chat` |

### 8.8 使用 Fallback 的服务

**TextService（9 个方法）：**

| 方法 | 获取方式 | fallback 覆盖 |
|---|---|---|
| `suggestImagePrompt` | `getAIProviderWithFallback('text')` | ✅ |
| `suggestTitles` | `getAIProviderWithFallback('text')` | ✅ |
| `suggestSlug` | `getAIProviderWithFallback('text')` | ✅ |
| `refineVoice` | `getAIProviderWithFallback('text')` | ✅ |
| `optimizeManuscript` | `getAIProviderWithFallback('text')` | ✅ |
| `generateScaffold` | `getAIProviderWithFallback('text')` | ✅ |
| `expandSection` | `getAIProviderWithFallback('text')` | ✅ |
| `translateName` | `getAIProviderWithFallback('text')` | ✅ |
| `translateStream` | `getAIProviderWithFallback('text')` | ✅ |

另有 `translate`、`summarize`、`recommendTags`、`recommendCategories`、`translateNames`、`suggestSlugFromName` 等方法通过内部工具函数（如 `requestTranslation`、`summarizeTextContent`、`recommendTagsContent` 等）间接使用 `getAIProviderWithFallback`，同样具备 fallback 能力。

**ImageService：**

| 方法 | 获取方式 | fallback 覆盖 |
|---|---|---|
| `continueTask`（内部） | `getAIImageProviderWithFallback()` | ✅ |

`generateImage` 作为异步任务入口，通过 `processImageGeneration` → `continueTask` 链路间接利用 fallback 能力。

### 8.9 用户透明性设计

`FallbackAIProvider` 对外以 `AIProvider` 接口呈现，服务层调用方无感知：

```typescript
// 服务层使用示例 — 调用方无需知道是否启用了 fallback
const provider = await getAIProviderWithFallback('text')
const response = await provider.chat({ messages, userId })
```

- 业务代码不需要条件分支来判断是否降级。
- `provider.name` 在降级场景下返回 `"openai+fallback:anthropic"` 格式，便于审计日志区分。
- 降级事件通过 `FallbackAIProvider.getFallbackEvents()` 获取，可用于后续写入 `AITask` 记录。
- 非核心接口（`check`、`getVoices`、`generateSpeech`、`estimateTTSCost`、`transcribe`）直接透传主 Provider，不执行 fallback，避免不必要的复杂性。

### 8.10 流式调用的降级约束

对于 `chatStream` 流式接口，由于 AsyncGenerator 的惰性特性（实际逻辑在调用方迭代 `.next()` 时才执行），设计中采用**保守策略**：

- 仅在初始连接阶段检测主 Provider 不可用时降级到备用。
- 流式传输中途的 SSE 断连等异步错误无法回滚已发送的部分，因此不切换 Provider。
- 若需要流式中途的完整容错，需在调用层实现 wrapper AsyncGenerator 拦截 yield 异常。

## 9. 相关文档 (Related Docs)

- [AI 图像生成模块](./ai-image.md)
- [AI 成本治理与多用户配额](../governance/ai-cost-governance.md)
- [语音识别系统](./asr.md)
- [音频处理与播客系统](./audio.md)
