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

- [ ] **文章转语音 (TTS Integration)**
    - 验收: 编辑器增加“生成音频”功能，支持选择语音模型 (OpenAI TTS/Azure)。
    - 验收: 生成的音频自动保存至存储系统，并作为 RSS 的 Enclosure 附件发布。
- [x] **高精度语音转录驱动演进 (AI Voice Transcription)**
    - 验收: 实现 Web Speech API (基础) 作为默认识别模式，提供低功耗、零延迟体验。
    - 验收: 将 Local Whisper 调整为实验性备用选项，移除其作为高精度核心的强制性。
- [ ] **云端语音识别系统 (Cloud ASR Hub)** (P1)
    - 验收: 实现 **SiliconFlow (Batch)** 驱动，支持上传录音文件进行全文精确转录。
    - 验收: 实现 **Volcengine (Streaming)** 驱动，支持通过 WebSocket 进行流式实时对讲。
    - 验收: 后端建立统一转写控制器，通过环境变量配置 API Key，确保密钥安全。
    - 验收: 优化文章编辑器中的“语音润色”工作流，支持识别后自动调用 LLM 整理大纲。
- [ ] **AI 图像驱动补全 (AI Image Drivers)**
    - 验收: 完成 **Gemini 3 Pro Image** 驱动，支持文本生成图片。
    - 验收: 完成 **Stable Diffusion** (WebUI API) 驱动，支持调用本地或云端 SD 实例。

### 3. 极客阅读与系统交互 (Geek UX & Notifications) (P1)

- [x] **沉浸式阅读模式 (Immersive Reader Mode)**
    - 验收: 文章详情页增加“沉浸阅读”开关，消除所有 UI 噪音。
    - 验收: 提供字号、行高调节以及“羊皮纸/护眼/暗黑”背景切换。
- [x] **实时通知系统基础 (SSE/Web Push Core)** (P1)
    - 验收: 建立基于 SSE (Server-Sent Events) 的实时连接中心。
    - 验收: 针对 Serverless 环境实现降级轮询机制，确保通知不中断。
    - 验收: 实现评论即时提醒与系统维护公告推送。

### 4. 全局架构固化与连接 (Architecture & Ecosystem) (P1/P2)

- [ ] **后端统一 i18n 机制 (Backend i18n Integration)**
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

### 1. 订阅中心与通知系统 (Subscription Hub & Notification System) (P1)
具体文档：[订阅中心与通知系统](../design/modules/notifications.md)
- [x] **多格式集成订阅源 (Universal Feeds)**
    - 验收: 在现有 RSS 2.0 基础上，增加对 **Atom 1.0** 和 **JSON Feed 1.1** 的原生支持。
    - 验收: 确保在所有格式中，音频附件 (Enclosure/Attachment)均能被正确解析且不与封面图冲突。
- [x] **多维订阅管理中心 (Subscription Management)**
    - 验收: 在用户设置中增加“订阅管理”页签，允许用户查看当前订阅状态。
    - 验收: **维度级订阅**: 支持用户按分类/标签勾选感兴趣的内容，实现精准推送。
    - 验收: 提供“一键取消订阅”功能。
- [x] **全站通知控制 (Unified Notifications)**
    - 验收: 整合系统通知（强制：登录提示、安全警告）与营销通知（可选：版本更新、功能推荐）。
    - 验收: 在用户管理中心提供营销类通知的订阅/退订开关。
- [x] **管理员营销管分发中心 (Marketing Admin Center)**
    - 验收: 后台增加营销模板配置页面，支持撰写简单的通知正文。
    - 验收: **灰度/定向分发**: 支持管理员选择特定标签/分类的订阅者进行投递。
    - 验收: 提供发送记录与基本的到达状态查看逻辑。
- [x] **通知系统强化与模块补全 (Notification Strengthening)** (P1)
    - [x] 验收: **营销类型区分**: 扩展 `MarketingCampaign` 类型字段，支持 `UPDATE`, `FEATURE`, `PROMOTION`, `BLOG_POST`, `MAINTENANCE`, `SERVICE`六大类。
    - [x] 验收: **博客推送联动 (二次确认机制)**: 
        - [x] 文章发布确认框增加“推送选项”（不推送/存为草稿/立即发送）。
        - [x] 实现首次发布时的逻辑分支，确保不同步误发。
        - [x] 文章管理页增加“再次推送到邮件”操作，支持预设内容。
    - [x] 验收: **管理员站务接收**: 后台增加管理员通知配置页，涵盖新用户、新评论、API 错误及系统警报。
- [x] **邮件模板与队列优化 (Templates & Queue)** (P2)
    - [x] 验收: **卡片式 HTML 模板引擎**: 实现基于 `table` 布局的 HTML 模板，支持封面图卡片展示。
    - [x] 验收: **发送前测试**: 增加“发送预览邮件到管理员邮箱”的功能，确保渲染正确。
    - [x] 验收: **变量替换引擎**: 实现支持多语言（$t）和自定义变量（{{articleTitle}}）的替换逻辑。
- [x] **营销推送定时化 (Scheduled Marketing)** (P1)
    - 验收: **通用定时引擎**: 升级任务引擎，支持扫描 `SCHEDULED` 状态的营销任务。
    - 验收: **定时设置**: 营销编辑页面支持设置计划发送时间。
    - 验收: **状态流转**: 实现从 `DRAFT` 到 `SCHEDULED` 再到 `COMPLETED/FAILED` 的完整自动化流。

### 2. 商业化集成 (Monetization) (P2)
- [x] **流量增长与变现 (Growth & Monetization)**
    - [x] 验收: **多维度显隐控制**: 支持按当前页面语言 (zh-CN/en-US) 动态决定外链/打赏码的展示与隐藏。
    - [x] 验收: **后台商业配置优化**: 提取共享组件 CommercialLinkManager 实现代码复用，并增加权限校验 (RBAC)。
    - [x] 验收: **社交链接与打赏集成**: 实现基于“个人配置+全局覆盖”的社交引流与赞助系统。
        - [x] 设计文档设计：[商业化与社交集成设计文档](../design/modules/commercial.md)
        - [x] 共享类型定义：[utils/shared/commercial.ts](../../utils/shared/commercial.ts)
        - [x] 数据库 Schema 更新：User 实体增加链接字段
        - [x] 缓存/配置项更新：COMMERCIAL_SPONSORSHIP
        - [x] 后端 API 实现：全局与个人配置的 CRUD
        - [x] 前端 UI 实现：文章底部渲染、个人中心配置、系统后台配置
    - [x] 验收: **多平台支持**: 覆盖微信、支付宝、爱发电等国内平台及 GitHub, Patreon, PayPal 等国际平台。
    - [x] 验收: **自定义扩展**: 提供 1-2 个自定义位置供用户配置特定图片/链接。
    - [x] 验收: **位置适配**: 在文章详情页末尾（正文后、版权声明前）增加显著的社交引导与打赏入口。
    - [x] 验收: **安全校验**: 对自定义 URL 加载进行白名单与协议校验。

### 3. AI 语音创作增强 (AI Voice Creative Enhancement) (P1)
具体文档：[AI 语音创作增强](../design/modules/voice.md)
- [x] **语音创作工作流 (Voice-to-Post)**
    - [x] 验收: **轻量化识别内核**: 实现基于 Web Speech API 的浏览器原生 V2T (Voice-to-Text) 识别。
    - [x] 验收: **多语言适配**: 识别引擎根据当前博文语言自动切换识别语种 (zh/en)。
    - [x] 验收: **实时反馈 UI**: 实现带动画的录音按钮及流式文本预览浮层。
    - [x] 验收: **AI 联动润色**: 提供“一键 AI 优化”动作，将识别出的口语文本通过现有 AI 路由转化为书面博文片段。
    - [x] 验收: **回退机制**: 针对不支持 Web Speech API 的浏览器提供优雅降级方案。

### 4. 高级 AI 创作流 (Advanced AI Creative Flow) (P1)
- [x] **多模态创作增强 (AI 图像生成)**
    - [x] 意图分析与技术架构方案设计 (已移除 DeepL 专项集成，统一使用 AI 翻译)
    - [x] **统一 AI 图像 API 入口**: 扩展 `AIProvider` 接口支持 `generateImage` 动作。
    - [x] **异步任务处理系统**: 实现基于数据库轮询的任务状态追踪机制，解决 Serverless 环境下的超时问题。
    - [x] **多模型适配**: 
        - [x] 实现 **豆包 (Doubao-Seedream-4.5)** 驱动适配（当前主选，已验证）。
        - [x] 实现 OpenAI DALL-E 3 驱动（代码已就绪，待测试）。
        - [ ] 实现 **Gemini 3 Pro Image** 驱动适配。
        - [ ] 实现 **Stable Diffusion** (WebUI/ComfyUI API) 驱动适配。
        - [x] 确保所有驱动支持自定义 API Endpoint。
    - [x] **图像持久化**: 自动下载 AI 生成的临时 URL 到本地存储，防止过期。
    - [x] **前端 UI 实现**: 增加“AI 生成封面”入口，支持提示词输入、模型选择与实时生成预览。

### 5. 第三方平台集成 (Third-party Integration) (P2)
- [x] **设计与调研 (Design & Research)**
    - 验收: 完成 Wechatsync 与 Memos 的接口调研，编写详细设计文档 [third-party.md](../design/modules/third-party.md)。
- [x] **Memos API 集成**
    - 验收: 实现 Memos v1 API 封装，支持在发布文章时同步推送摘要/正文。
    - 验收: 后台增加 Memos 实例 URL 与 Access Token 配置。
- [x] **Wechatsync 插件联动**
    - 验收: 集成 `article-syncjs` SDK，支持在后台管理页面一键唤起同步框。
    - 验收: 确保图片路径与 Markdown 格式转换符合国内平台（知乎/头条）抓取规范。

### 6. AI Agent 与自动化生态 (AI Agent & Automation Ecosystem) (P1)
- [ ] **Anthropic MCP Server 实现**
    - [x] 设计优化：完善 `docs/design/modules/mcp.md` 及 API 规格定义。
    - [x] **主项目 API 实现**：已完成 Posts 基础 CRUD 外部接口实现。
    - [x] **MCP Server 脚手架 (`packages/mcp-server`)**：已完成基础架构、构建配置（tsdown）、测试配置（vitest）与代码规范（eslint）。
    - [x] **验证与测试**：编写单元测试辅助验证 Tool 注册逻辑，通过 Vitest 测试。
- [x] **定时发布功能 (Scheduled Publication)** (P1)
    - [x] 验收: 完成详细设计文档 [scheduled-publication.md](../design/modules/scheduled-publication.md)。
    - [x] 验收: **类型与实体扩展**:
        - [x] 在 `PostStatus` 中增加 `SCHEDULED` 状态。
        - [x] 更新 `POST_STATUS_TRANSITIONS` 状态转换矩阵。
    - [x] 验收: **后端执行引擎**:
        - [x] 模块化 `executePublish` 逻辑，支持复用。
        - [x] 实现 `processScheduledPosts` 扫描与处理逻辑。
    - [x] 验收: **多环境触发适配**:
        - [x] 实现 Webhook API 端点 (带 Token 校验)。
        - [x] 实现自部署环境下的后台定期轮询插件。
    - [x] 验收: **编辑器 UI 增强**:
        - [x] 支持在编辑页配置发布时间并选择定时发布。
        - [x] 状态显示增加 `SCHEDULED` 对应的标签。

### 7. 系统固化 (System Hardening) (P1)
- [x] **认证配置强制锁定**: 
    - 验收: 在系统设置中，强制锁定 `AUTH_SECRET` 及 OAuth 凭据，防止在未重构前通过数据库修改导致配置不一致。
    - 验收: 更新系统设计文档，说明当前 Auth 变量的使用机制及长期优化路径。

### 8. 质量与维护 (Quality & Maintenance) (P0)
- [x] **修复组件单元测试失败 (Fix Component Unit Test Failures)** (P0)
    - [x] 验收: 解决 `demo-banner.test.ts` 中由于 RuntimeConfig 模拟不全和路由器初始化导致的 `TypeError`。
- [x] **文章编辑页面 UI/UX 优化 (Article Editor UI/UX Optimization)** (P1)
    - [x] 验收: **顶部工具栏聚合**: 将 AI 建议、翻译与格式化按钮进行视觉聚合，提升空间利用率。
    - [x] 验收: **发布状态重定位**: 将文章发布状态标签移至“发布”按钮旁，与操作逻辑对齐。
    - [x] 验收: **语言切换器优化**: 重构顶部语言切换逻辑，使其更符合直觉。
    - [x] 验收: **“同步”图标纠偏**: 将微信/多平台同步按钮图标更改为 `pi-sync`，明确“同步”而非“分享”语义。
    - [x] 验收: **设置侧边栏交互升级**: 
        - [x] 将 Drawer 改为自定义侧边栏（不产生遮罩）。
        - [x] 实现内容区随侧边栏开关的平滑位移动画，头部工具栏不再被遮挡。
        - [x] 新建文章时侧边栏默认展开，并支持“精简”与“标准”两种宽度切换。
- [x] **修复类型检查错误**
    - [x] 识别 `packages/cli/src/parser.test.ts` 中未使用变量 `vi` (TS6133)
    - [x] 移除冗余代码并验证 `pnpm run typecheck`

### 9. 文档同步与优化 (Documentation Sync & Optimization) (P1)
- [x] **全站功能特性同步 (Feature Sync)**
    - 验收: 更新 `docs/guide/features.md`，补全语音写作、AI 生图、商业化、三方集成、定时发布、多维订阅等 P1 特性。
- [x] **部署与环境配置更新 (Deploy Guide Update)** 
    - 验收: 同步 `docs/guide/deploy.md`，增补 Stage 5 引入的所有新环境变量（AI 生图 Provider、Memos 相关、任务 Token 等）。
- [x] **架构与数据库文档对齐 (Database & API Hardening)**
    - 验收: 更新 `docs/design/database.md`，补全 `MarketingCampaign` 实体及 `Subscriber` 的维度扩展字段。
    - 验收: 确保 `docs/design/api.md` 的模块列表与 `server/api` 真实目录结构完全对齐。
- [x] **模块化文档精修 (Module Docs Refinement)**
    - 验收: 审计 `docs/design/modules/` 下的所有文档，修正已变更的接口字段名。
    - 验收: 为“定时发布”与“AI 异步任务”补全 Mermaid 流程图。
- [x] **全局链接与术语优化 (Cleanup)**
    - 验收: 修复全站 MD 链接失效，规范化“翻译簇”、“发布意图”等核心术语。

### 10. 文档国际化 (Documentation Internationalization) (P1)
- [x] **i18n 基础架构搭建 (Base Infrastructure)**
    - 验收: 完成 VitePress 多语言配置，实现 URL 前缀路由控制。
- [x] **英文站点脚手架 (English Docs Scaffolding)**
    - 验收: 初始化 `docs/en-US/` 目录并同步核心目录结构。
- [x] **核心文档首轮翻译 (Core Translation)**
    - 验收: 完成首页、快速开始、部署指南、功能特性的首轮人工/AI 协同翻译。
- [x] **动态文档同步策略 (Sync Strategy)**
    - 验收: 制定 `README.md` 等文件的双语滚动更新机制，确保一致性。

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
