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

-   **统一适配器系统 (Unified Adapter System)**: 封装统一的 `AIProvider` 接口，支持多种厂商。
    -   **OpenAI Provider**: 支持标准 OpenAI 协议。可配置 `AI_ENDPOINT` 以适配 DeepSeek、Azure、OneAPI 等第三方服务。
    -   **Anthropic Provider**: 支持 Anthropic Claude 系列 API。
-   **提供者工厂 (Provider Factory)**: 根据 `.env` 中的 `AI_PROVIDER` 自动实例化对应的适配器。
-   **Prompt 管理器**: 在服务端统一管理 Prompt 模板，确保输出质量和格式（如 Markdown 兼容性）。
-   **流式响应 (SSE)**: (增强功能) 对于长文本生成任务，支持流式输出以提升用户体验。

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

### 4.1 管理后台专用接口 (`/api/admin/ai/*`)

-   `POST /api/admin/ai/suggest-titles`:
    -   输入: `{ content: string }`
    -   输出: `{ suggestions: string[] }`
-   `POST /api/admin/ai/translate`:
    -   输入: `{ content: string, from: string, to: string, format: 'markdown' }`
    -   输出: `{ translatedContent: string }`
-   `POST /api/admin/ai/summarize`:
    -   输入: `{ content: string, maxLength: number }`
    -   输出: `{ summary: string }`

## 5. 交互设计 (Interaction Design)

-   **编辑器侧边栏 (AI Toolset)**: 在 Markdown 编辑器侧边集成 AI 工具箱。
-   **预览与替换**: AI 生成的内容不直接覆盖，而是提供预览对比，用户确认后再应用。
-   **任务进度条**: 处理长文本时显示清晰的进度。
