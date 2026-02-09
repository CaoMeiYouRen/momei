# AI 图像生成模块设计 (AI Image Generation Module)

## 1. 概述 (Overview)

本模块旨在为博主提供便捷的 AI 图像生成能力，主要用于生成文章封面、插图等。考虑到不同 AI 绘图模型（如 DALL-E, Stable Diffusion, Gemini Pro Image, 豆包 Seedream）的接口差异较大且生成耗时较长，本模块设计了一个统一的异步任务管理系统。

计划优先接入的模型包括：
- **Gemini 3 Pro Image (Nano Banana Pro)**: 谷歌多模态图像生成模型。
- **Stable Diffusion (SD)**: 开源社区主流绘图模型，支持本地部署或第三方 API。
- **豆包 (Doubao-Seedream-4.5)**: 字节跳动自研高质绘图模型。
- **OpenAI DALL-E 3**: 行业标配绘图模型。

为了保证极致的兼容性，所有 Provider 均支持**自定义 API 地址**，以便用户接入各种转发服务或自建网关。

## 2. 核心挑战与解决方案 (Challenges & Solutions)

### 2.1 接口多样性
**挑战**: 每个 AI 厂商的绘图接口、参数（尺寸、步数、风格）格式各异。
**方案**: 扩展现有的 `AIProvider` 体系，定义统一的 `AIImageOptions` 和 `AIImageResponse`，屏蔽底层差异。

### 2.2 Serverless 环境下的超时问题
**挑战**: 图像生成通常需要 10-60 秒，而 Vercel/Cloudflare 等 Serverless 平台有严格的请求超时限制（通常 10-30s）。
**方案**: 引入 **异步任务系统 (AITask System)**。
- 客户端发起生成请求，后端立即返回 `taskId`。
- 后端在后台继续处理（Node.js 端异步执行或使用云平台提供的 Workflows）。
- 客户端通过轮询 `/api/ai/task/status/:id` 获取结果。

### 2.3 临时 URL 过期
**挑战**: OpenAI 等平台生成的图片 URL 通常在 1 小时内失效。
**方案**: 图片生成完成后，系统自动将其下载并存入 Momei 的本地存储或媒体库中，返回持久化后的 URL。

## 3. 技术设计 (Technical Design)

### 3.1 任务实体 (AITask Entity)

```typescript
@Entity('ai_tasks')
export class AITask {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    type: 'image_generation'

    @Column({ default: 'processing' })
    status: 'processing' | 'completed' | 'failed'

    @Column({ type: 'text', nullable: true })
    payload: string // 原始请求参数

    @Column({ type: 'text', nullable: true })
    result: string // 生成结果的 JSON (包括持久化后的 URL)

    @Column({ type: 'text', nullable: true })
    error: string

    @Column()
    userId: string

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}
```

### 3.2 Provider 扩展

```typescript
export interface AIImageOptions {
    prompt: string
    model?: string
    size?: string // 1024x1024, landscape, portrait
    quality?: 'standard' | 'hd'
    style?: 'vivid' | 'natural'
}

export interface AIProvider {
    // ... 原有 chat 接口
    generateImage?(options: AIImageOptions): Promise<AIImageResponse>
}
```

### 3.3 核心流程 (Workflow)

1. **请求阶段**: `POST /api/ai/image/generate`
   - 校验权限。
   - 创建 `AITask` 记录，状态为 `processing`。
   - 触发异步处理程序（不阻塞 HTTP 响应）。
   - 返回 `taskId` 给前端。

2. **生成与持久化**:
   - `AIProvider` 调用对应的 AI 接口获取原始 URL。
   - 自动调用 `UploadService` 将图片转存至本地/对象存储。
   - 更新 `AITask` 记录，将状态改为 `completed`。

3. **轮询阶段**: `GET /api/ai/task/status/:id`
   - 前端定时检查。
   - 若状态为 `completed`，展示图片并允许用户设为封面。

## 4. 接口定义 (API Definition)

- `POST /api/ai/image/generate`
  - Body: `AIImageOptions`
  - Response: `{ taskId: string }`

- `GET /api/ai/task/status/:id`
  - Response: `{ status: string, result?: AIImageResponse, error?: string }`

- `GET /api/admin/ai/tasks` (仅管理员)
  - 分页返回任务列表。

## 5. 交互设计 (UX Design)

1. **入口**: 在文章侧边栏“封面设置”增加“AI 生成”按钮。
2. **浮窗**: 弹出生成面板。
   - **预设词**: 提供常用风格建议（如 3D Render, Oil Painting, Minimalist）。
   - **参数选择**: 比例（16:9 / 1:1）、模型选择。
3. **进度展示**: 面板显示“魔术棒”动画及正在进行的任务。
4. **结果确认**: 展示生成出的图片。
   - 选项 A：使用此图（自动设为封面并保存）。
   - 选项 B：重新生成（基于旧提示词修改）。

## 6. 后续扩展 (Future Extensions)

- **图像润色 (Inpainting/Outpainting)**: 局部修改或边缘扩展。
- **图生图 (Img2Img)**: 基于草图生成精美图片。
- **批量生成**: 一次生成多张供用户挑选。

---

## 7. 实现进度 (Implementation Status)

- [x] **任务核心引擎**: 基于 `AITask` 实体与 API 轮询的异步生成闭环已打通。
- [x] **持久化流**: AI 生成图片自动转存本地/S3 命名为 `ai/{taskId}.jpeg`。
- [x] **模型适配**:
    - **豆包 (Doubao-Seedream-4.5)**: **已完备**。已解决鉴权、尺寸映射及本地化存储。
    - **OpenAI (DALL-E 3)**: **就绪**。底层架构已支持，接口参数对齐。
    - **Gemini / Stable Diffusion**: 规划中。
- [x] **前端交互**: `AiImageGenerator` 组件实现预览、轮询、重试及应用到封面功能。
- [x] **安全性**: 接入后端 `rateLimit` 中间件，对状态接口进行定向放行（30 次/分）。
