# 墨梅 (Momei) 待办事项 (Todo List)

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

## 状态说明

- [ ] 待办 (Todo)
- [x] 已完成 (Done)
- [-] 已取消 (Cancelled)

## 第六阶段：全方位体验与创作精修 (Global Experience & Creative Refinement)

> **当前阶段**: Phase 6
> **核心目标**: 强化创作安全感、提升多媒体生产力，并优化极客阅读交互。

---

### 1. 创作安全增强 (Creative Security & Resilience) (P0)
具体文档：[创作安全增强](../design/modules/creative-security.md)

- [x] **本地草稿自动保存 (Local Draft Auto-save)**
    - 验收: 实现基于 LocalStorage 的文章实时编辑缓存 (防抖处理)。
    - 验收: 用户刷新或重新进入编辑器时，检测到本地缓存后弹出“恢复/丢弃”选择框。
    - 验收: 成功发布文章后，自动清除对应的本地缓存。
- [x] **有限版本化管理 (Limited Content Versioning)**
    - 验收: 文章保存时记录版本快照，数据库保留最近 3-5 个修改版本。
    - 验收: 编辑器增加“历史版本”查看面板，支持对比不同时间点的文字差异。
    - 验收: 支持“一键回滚”至选中的旧版本。
- [x] **全量文章导出 (Universal Export)** (P1)
    - 验收: **单篇导出**: 在文章编辑页/管理页支持直接下载为 `.md` 文件，包含标准的 Hexo Front-matter。
    - 验收: **批量导出**: 管理后台支持勾选多篇文章，一键打包为 `.zip` 下载，内部结构扁平。
    - 验收: **兼容性映射**: 导出时自动将 Momei 字段（标题、日期、分类、标签、Slug）映射至 Hexo 标准格式，丢弃不兼容的特有元数据。
    - 验收: **权限隔离**: 管理员可导出全站文章，普通作者仅能导出本人创作的作品。
    - 验收: **多语言处理**: 导出的文件名包含语言后缀且支持翻译聚合导出。

### 2. 播客与多媒体生产力 (Advanced Multimedia & AI) (P1)

- [/] **文章音频化系统 (Audio-ization System)** (P1)
    - [x] **Phase 1: 核心基础与数据库支持**
        - [x] 重构 `AITask` 实体，合并 `TTSTask` 实现通用任务管理
        - [x] 扩展 `Post` 实体中的 TTS 相关字段
        - [x] 实现 TTS 服务抽象接口与 OpenAI 提供者
        - [x] 实现简单的异步任务处理逻辑
    - [x] **Phase 2: 页面集成与 API**
        - [x] 实现 `POST /api/posts/:id/tts` 生成接口
        - [x] 实现 `GET /api/tasks/tts/:id` 状态查询接口
        - [x] 文章编辑器侧边栏增加音频设置面板与生成对话框
    - [/] **Phase 3: 其他提供者与播客模式 (部分延迟)**
        - [x] 实现火山引擎 (豆包) 提供者 (V3 HTTP) (由于接口对接问题，暂时下线并隐藏)
        - [ ] 实现 AI 播客 (Podcast) 模式生成逻辑 (延迟至后续阶段)
        - [ ] 音频元数据保存与 RSS Enclosure 自动关联
- [x] **AI 基础设施重构 (AI Infrastructure Refactoring)** (P1)
    - [x] **API 路径统一**: 将 TTS 移至 `/api/ai/tts`，统一 ASR 风格。
    - [x] **权限松绑**: ASR/TTS API 支持 Author 角色。
    - [x] **逻辑分层**: Provider 驱动移至 `utils`，业务逻辑保留在 `services`。
    - [x] **配置外露**: 公共环境变量集成至 `public.get.ts`。
    - [x] **验收点**:
        - 验收: 实现统一的音频化控制器，支持 **标准 TTS** 与 **AI 播客 (Dual Human)** 模式。
        - 验收: 编辑器增加“生成音频”功能，支持选择提供者 (OpenAI/Azure/SiliconFlow)。 (火山引擎已隐藏)
        - [ ] 验收: 集成 **火山引擎 (豆包)** WebSocket V3 接口，支持流式生成播客音频。 (延迟)
        - 验收: 生成的音频自动保存并作为 RSS 的 Enclosure 附件发布。
- [x] **高精度语音转录驱动演进 (AI Voice Transcription)**
    - 验收: 实现 Web Speech API (基础) 作为默认识别模式，提供低功耗、零延迟体验。
    - 验收: 移除离线 Transformers.js 降级方案，保持包体轻量。
- [x] **云端语音识别系统 (Cloud ASR Hub)** (P1)
    - 验收: 实现 **SiliconFlow (Batch)** 驱动，支持上传录音文件进行全文精确转录。
    - 验收: 成功修复 SiliconFlow 400 错误并通过语言代码标准化提高兼容性。
    - [ ] 验收: 实现 **Volcengine (Streaming)** 驱动，支持通过 WebSocket 进行流式实时对讲。 (由于接口问题暂时下线)
    - 验收: 优化界面逻辑，仅在配置了 API 渠道时显示 Cloud ASR 选项。
    - 验收: 后端建立统一转写控制器，通过环境变量配置 API Key，确保密钥安全。
    - 验收: 优化文章编辑器中的“语音润色”工作流，支持识别后自动调用 LLM 整理大纲。

### 3. UI 交互体验优化 (UI & UX Optimization) (P0)

- [x] **文章详情页响应式布局优化 (Article Detail Responsive Layout)**
    - 校验: 修复文章宽度导致的横向滚动条问题。
    - 校验: 修复移动端工具栏和底边栏宽度及按钮定位问题。
    - 校验: 优化文章正文在不同屏幕尺寸下的动态响应能力。
    - 校验: 优化头图缩放逻辑，修复裁剪不当问题。
    - 校验: 实现头图点击查看大图功能。
- [/] **AI 图像驱动补全 (AI Image Drivers)**
    - [x] **任务核心引擎**: 基于 `AITask` 实体与 API 轮询的异步生成闭环已打通。
    - [x] 验收: 完成 **Gemini 3 Pro Image** 驱动，支持文本生成图片。
    - [x] 验收: 完成 **Stable Diffusion** (WebUI API) 驱动，支持调用本地或云端 SD 实例。

### 4. 极客阅读与系统交互 (Geek UX & Notifications) (P1)

- [x] **沉浸式阅读模式 (Immersive Reader Mode)**
    - 验收: 文章详情页增加“沉浸阅读”开关，消除所有 UI 噪音。
    - 验收: 提供字号、行高调节以及“羊皮纸/护眼/暗黑”背景切换。
- [x] **文章详情页移动端适配优化 (Mobile Reading Optimization)** (P1)
    - 验收: 优化文章标题、正文及各级标题 (H1-H6) 在移动端的响应式字体大小与行高。
    - 验收: 优化移动端面包屑导航与文章元数据（作者、日期、阅读量等）的排版布局，避免窄屏拥挤。
    - 验收: 调整文章容器在移动端的侧边距 (Padding)，结合 Typography 规范提升阅读呼吸感。
    - 验收: 确保文章内代码块、图片及表格在窄屏下具备良好的交互体验（不溢充、支持横向滚动）。
- [x] **实时通知系统基础 (SSE/Web Push Core)** (P1)
    - 验收: 建立基于 SSE (Server-Sent Events) 的实时连接中心。
    - 验收: 针对 Serverless 环境实现降级轮询机制，确保通知不中断。
    - 验收: 实现评论即时提醒与系统维护公告推送。

### 5. 全局架构固化与连接 (Architecture & Ecosystem) (P1/P2)

- [x] **后端统一 i18n 机制 (Backend i18n Integration)**
    - 验收: 基于 Nitro 钩子实现请求级的语言识别。
    - 验收: 邮件模板、RSS 摘要及错误码反馈实现全自动关联翻译。
- [ ] **MCP 生态生产验证 (MCP Validation)**
    - 验收: 完成 MCP Server 在多环境下的性能压力测试。
    - 验收: 完善 MCP 对 Cursor/Claude 等 AI 编辑器的交互定义文件。

---

> **说明**: 长期规划与积压项已统一迁移至 [项目计划](./roadmap.md) 文档。
> 待办事项 (Todo) 仅包含当前阶段的具体实施任务，新功能需求请直接在 [roadmap.md](./roadmap.md) 中添加。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
