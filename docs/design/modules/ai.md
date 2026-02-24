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

### 3.2 环境变量配置

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
