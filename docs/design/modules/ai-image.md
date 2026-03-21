# AI 图像生成模块 (AI Image Generation)

## 1. 概述 (Overview)

本模块已从“封面图专用生成器”收敛为统一的 AI 视觉资产生成能力。当前支持同一套任务链路驱动以下视觉场景：

- 文章封面 `post-cover`
- 文章配图 `post-illustration`
- 专题头图 `topic-hero`
- 活动图 `event-poster`

前端编辑器当前已接入“文章封面 + 文章配图”两类入口；专题头图与活动图沿用同一套请求契约与提示词模型，为后续专属编辑器复用预留一致边界。

## 2. 核心架构

### 2.1 统一驱动 (Unified Drivers)

系统实现了 `AIImageProvider` 接口，支持多种适配器：

- **Gemini 2/3 Pro Image**: 谷歌多模态绘图模型。
- **Stable Diffusion**: 支持通过 WebUI 或 ComfyUI API 进行本地/第三方调用。
- **DALL-E 3**: OpenAI 绘图服务。
- **豆包 Seedream**: 字节跳动高质绘图模型。

### 2.2 异步任务系统 (AITask)

由于图片生成通常耗时超过 15 秒，系统继续采用异步轮询机制：

1. 客户端提交请求，立即获取 `taskId`。
2. 后端在 `AITask` 表中追踪任务进度。
3. 任务完成后，后端自动将临时 URL 持久化下载至存储库，防止过期。

### 2.3 五维提示词模型 (Five-Dimension Prompt Model)

所有视觉场景统一收敛为以下五个维度：

- **类型 type**: 主体、构图和画面重心。
- **配色 palette**: 主色、辅色和对比关系。
- **渲染 rendering**: 材质、技法和视觉风格。
- **文本 text**: 标题、留白、安全区和排版处理。
- **氛围 mood**: 情绪、光照和整体气场。

维度解析逻辑由 `utils/shared/ai-visual-asset.ts` 统一提供，遵循以下策略：

1. 先按视觉场景加载默认 preset。
2. 再从文章标题、摘要或正文摘要中提取可推导的信息作为输入来源。
3. 用户手动编辑的维度覆盖默认值与 AI 建议值。
4. 最终通过统一的 prompt composer 合成为可提交给图片模型的最终 Prompt。

## 3. 自动回填边界

### 3.1 applyMode 语义

- `auto-apply`: 允许服务端在满足场景与语言约束时自动写回实体。
- `manual-confirm`: 仅生成候选图，等待前端确认后再写回封面或插入正文。

### 3.2 当前默认边界

- 编辑器内封面生成默认使用 `manual-confirm`，避免绕过人工选图确认。
- 文章配图当前只支持“生成候选图 -> 人工确认 -> 插入 Markdown 正文 + 记录 metadata.visualAssets”。
- 服务端只有在 `assetUsage === post-cover` 且 `applyMode === auto-apply` 时才允许自动回填 `post.coverImage`。

## 4. 元数据事实源

文章视觉资产统一保存在 `Post.metadata` 中：

- `metadata.cover`: 继续承担封面兼容字段，供现有公开链路与旧逻辑读取。
- `metadata.visualAssets[]`: 新的通用视觉资产数组，记录不同 usage 的 URL、提示词、五维模型、应用模式与语言绑定信息。

这样可以在不破坏现有封面消费链路的前提下，为文章配图、专题头图和活动图复用同一事实源。

## 5. 技术规范

- **持久化**: 自动重命名并转存，生成符合 Momei 命名规范的文件路径。
- **提示词生成**: `/api/ai/suggest-image-prompt` 现在返回结构化五维模型和组合后的最终 Prompt，而不是单段自由文本。
- **参数约束**: `assetUsage`、`applyMode` 与 `promptDimensions` 已纳入 `utils/schemas/ai.ts` 的统一校验。
- **元数据约束**: `promptModel`、`visualAssets` 与封面扩展字段已纳入 `utils/schemas/post.ts` 的统一校验。

---
> 关联代码: `components/admin/posts/ai-image-generator.vue` | `components/admin/posts/post-editor-media-settings.vue` | `server/services/ai/image.ts` | `server/services/ai/text.ts` | `utils/shared/ai-visual-asset.ts`
