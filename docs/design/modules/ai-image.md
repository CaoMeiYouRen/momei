# AI 图像生成模块 (AI Image Generation)

## 1. 概述 (Overview)

本模块旨在为博主提供便捷的 AI 图像生成能力，主要用于生成文章封面、插图等。系统通过异步任务管理，支持长耗时的图像生成流程。

## 2. 核心架构

### 2.1 统一驱动 (Unified Drivers)
系统实现了 `AIImageProvider` 接口，支持多种适配器：
- **Gemini 2/3 Pro Image**: 谷歌多模态绘图模型。
- **Stable Diffusion**: 支持通过 WebUI 或 ComfyUI API 进行本地/第三方调用。
- **DALL-E 3**: OpenAI 绘图服务。
- **豆包 Seedream**: 字节跳动高质绘图模型。

### 2.2 异步任务系统 (AITask)
由于图片生成通常耗时超过 15 秒，系统采用异步轮询机制：
1. 客户端提交请求，立即获取 `taskId`。
2. 后端在 `AITask` 表中追踪任务进度。
3. 任务完成后，后端自动将临时 URL 持久化下载至存储库，防止过期。

## 3. 技术规范

- **持久化**: 自动重命名并转存，生成符合 Momei 命名规范的文件路径。
- **灵活配置**: 允许在后台配置每个 Provider 的 API Endpoints 及特定模型参数（如尺寸、步数、负向提示词）。

---
> 关联代码: `server/services/ai-image.ts` | `server/utils/ai/drivers/`
