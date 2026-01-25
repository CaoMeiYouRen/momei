# 播客功能设计文档 (Podcast Design)

## 1. 概述
本文档描述了墨梅博客中播客功能的初步实现方案。目标是在第 4 阶段引入基础的音频托管与 RSS 播客分发能力，支持技术创作者分发音频内容。

## 2. 核心需求
- **轻量托管**：支持关联外部音频 URL 或直接上传音频文件。
- **上传增强**：重构现有上传逻辑，抽象出类型化上传，支持音频文件的大容量限制。
- **RSS 兼容**：自动生成符合 iTunes/Apple Podcasts 标准的 RSS 标签（如 `<enclosure>`）。
- **极简元数据**：通过 HEAD 请求自动推断远程文件信息，UI 端支持手动录入时长等 ID3 数据。

## 3. 技术方案

### 3.1 实体模型变更 (Entity Changes)
在 `Post` 实体中增加以下可选字段：

| 字段名          | 类型    | 说明                                     |
| --------------- | ------- | ---------------------------------------- |
| `audioUrl`      | string  | 音频文件地址 (本地路径或远程 URL)         |
| `audioDuration` | number  | 音频时长 (秒)                             |
| `audioSize`     | number  | 音频文件大小 (字节)                       |
| `audioMimeType` | string  | 音频 MIME 类型 (如 `audio/mpeg`)          |

### 3.2 上传服务重构 (`server/services/upload.ts`)
- **接口定义类型化**：
  ```typescript
  export enum UploadType {
    IMAGE = 'image',
    AUDIO = 'audio',
    FILE = 'file'
  }
  ```
- **差异化配置**：
  - `MAX_IMAGE_SIZE`: 默认为 5MB (现有逻辑)。
  - `MAX_AUDIO_SIZE`: 默认为 100MB (环境变量可配)。
- **前缀管理**：
  - 图片: `public/uploads/images/`
  - 音频: `public/uploads/audios/`

### 3.3 元数据采集逻辑
- **HEAD 请求工具**：
  实现一个工具函数，通过 `fetch(url, { method: 'HEAD' })` 获取 `Content-Length` 和 `Content-Type`。
- **UI 交互**：
  当用户输入外部 URL 后，前端触发该接口进行校验并自动填充“大小”和“类型”字段。

### 3.4 RSS/Podcast Feed 增强
- **Enclosure 标签**：
  在 `generateFeed` 逻辑中，如果文章存在 `audioUrl`，则生成：
  `<enclosure url="..." length="..." type="..." />`
- **独立播客源**：
  实现 `/feed/podcast.xml` 路由，仅过滤包含 `audioUrl` 且已发布的文章。
- **iTunes 命名空间**：
  在 RSS 中引入 `itunes` 命名空间，支持：
  - `<itunes:duration>`
  - `<itunes:image>` (复用文章封面)
  - `<itunes:author>` (复用文章作者)

## 4. 后续演进 (Backlog)
- **AI 语音转文字 (STT)**：自动生成文章稿件。
- **AI 文字转语音 (TTS)**：为纯文本文章生成朗读版。
- **全站悬浮播放器**：支持断点续播与播放进度跨页面持久化。
