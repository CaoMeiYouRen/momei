# 音频处理与播客系统 (Audio & Podcast System)

本文档定义了墨梅博客中文章音轨 (Audio Tracks) 托管、文章转语音 (TTS) 与播客 (Podcast) 订阅功能的实现方案。

## 1. 核心目标

- **多模式音频化**:
  - **静态托管**: 支持手动关联外部音频 URL 或上传本地音频。
  - **AI 生成 (TTS)**: 集成 OpenAI/Azure TTS，实现一键文章转朗读。
  - **AI 播客 (Podcast)**: (规划中) 针对双人对话式内容生成。
- **播客分发**: 符合 iTunes/Apple Podcasts 标准的 RSS 播客分发能力。
- **全站播放**: 为极客读者提供沉浸式的后台播放体验。

## 2. 数据库设计

### 2.1 Post 实体音频字段
在 `Post` 实体中包含以下可选字段：

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `audioUrl` | string | 音频文件地址 (本地路径或远程 URL) |
| `audioDuration` | number | 音频时长 (秒) |
| `audioSize` | number | 音频文件大小 (字节) |
| `audioMimeType` | string | 音频 MIME 类型 (如 `audio/mpeg`) |
| `audioProvider` | string | 生成提供者 (openai, azure, manual) |

### 2.2 AI 任务表 (`AITask`)
记录耗时的 TTS 生成任务：

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | `uuid` | 主键 |
| `type` | `varchar` | `tts` 或 `podcast` |
| `postId` | `uuid` | 关联文章 |
| `status` | `varchar` | `pending`, `processing`, `completed`, `failed` |
| `result` | `text` | 生成结果 URL 或错误信息 |

## 3. 技术实现

### 3.1 TTS 提供者 (TTS Providers)
系统采用统一的接口封装不同的 AI 语音合成服务：
- **OpenAI**: 高质量、多音色（如 `alloy`, `echo`, `shimmer`）。
- **Azure**: 神经网络音色，适合长文本。
- **SiliconFlow**: 兼容 OpenAI API 的国内高性价比替代方案。

### 3.2 播客分发 (RSS/Podcast Feed)
- **Enclosure 标签**: 在 RSS 生成逻辑中，若文章存在 `audioUrl`，则自动生成 `<enclosure url="..." length="..." type="..." />`。
- **独立播客源**: `/feed/podcast.xml` 路由仅输出带有音频的文章。
- **iTunes 兼容**: 引入 `itunes` 命名空间，支持 `<itunes:duration>`, `<itunes:image>` 等标签。

### 3.3 前端交互
- **上传管理**: 通过 `use-upload.ts` 组件支持大文件音频上传（最高 100MB）。
- **任务追踪**: 通过 `use-tts-task.ts` 轮询后端生成的异步任务状态。

## 4. 后后续演进 (Backlog)
- **文本转播客 (Text-to-Podcast)**: 生成对话脚本并合成多人音频。
- **全站悬浮播放器**: 支持断点续播与播放进度跨页面持久化。
