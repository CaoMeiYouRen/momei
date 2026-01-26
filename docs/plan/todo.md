# 墨梅 (Momei) 待办事项 (Todo List)

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

## 状态说明

- [ ] 待办 (Todo)
- [x] 已完成 (Done)
- [-] 已取消 (Cancelled)

## 第四阶段：专业化与创作进阶 (Professionalization & Creative Empowerment) (进行中)

### 1. 专业内容渲染引擎 (Rendering Engine)
- [x] **数学公式支持 ($LaTeX$) (P0)**
    - 验收: 集成 KaTeX 或 MathJax 插件，支持行内 `$x^2$` 和块级 `$$...$$` 语法渲染。
    - 验收: 确保数学公式样式在 Dark Mode 下能正确自适应且不产生布局偏移。
- [x] **Lighthouse 性能冲刺 (P0)**
    - 验收: 核心页面 (首页、文章详情) 在移动端与桌面端的 Lighthouse 性能、SEO、无障碍得分均达标 (>= 90)。
    - 验收: 实现字体加载优化 (Swap)、关键 CSS 内联及第三方脚本延迟加载。

### 2. 高级 AI 创作流 (Advanced AI Workflow)
- [ ] **灵感捕捉引擎 (Inspiration Engine) (P1)**
    - 参考 [灵感捕捉引擎设计规范](../design/modules/inspiration.md)
    - [x] 验收: 实现“灵感碎片 (Snippets)” 实体模型，包含内容、媒体附件、来源元数据及状态管理。
    - [x] 验收: 实现通用的、基于令牌鉴权的 REST API，支持各类外部工具（如 cURL, 书签脚本）调用。
    - [ ] 验收: **PWA 极简采集模式**: 支持“添加到主屏幕”，提供秒开即输的移动端原生化体验。
    - [ ] 验收: 提供通用的“浏览器书签脚本 (Bookmarklet)”，支持一键抓取网页内容。
    - [x] 验收: 仪表盘实现“快速采集”组件，支持闪念胶囊式快捷输入，并支持单一/聚合转文章大纲工作流。
- [x] **数据库实体与模型**
    - 验收: `Snippet` 实体建立，支持内容、媒体、来源、状态等字段。
    - 验收: 实现与 `User` 和 `Post` 的关联关系。
- [x] **灵感采集 API**
    - 验收: 支持统一的 `/api/snippets` 接口，兼容 API Key 和 Session 鉴权。
    - 验收: 提供 CRUD 管理 API (`/api/admin/snippets/*`)。
- [x] **AI 辅助工作流**
    - 验收: 实现单条灵感快速转文章。
    - 验收: 实现多条灵感 AI 聚合生成文章大纲 (Scaffold)。
- [x] **管理后台 UI**
    - 验收: 实现灵感收纳箱 (Inbox) 列表展示。
    - 验收: 实现“快速采集”组件。
    - 验收: 实现 AI 聚合预览与转换流程。
- [x] **国际化支持**
    - 验收: 补充灵感引擎相关 i18n 词条。
- [x] **自动化测试验证**
    - 验收: Vitest 测试用例 100% 通过。

- [ ] **脚手架式写作助手 (Scaffold Assistant) (P1)**
    - [x] 验收: 实现“智能大纲生成”，基于灵感片段或核心词生成 3-5 个逻辑章节建议。
    - [ ] 验收: 提供“论点扩充”功能，辅助作者挖掘每个章节的深度。

### 3. 生态准入与社会化互动 (Ecosystem & Interaction)
- [ ] **极速迁移方案 (Hexo Support) (P1)**
    - 验收: 支持解析 Hexo Markdown (Front-matter) 并实现资源路径自动修正。
    - 验收: **混合模式安装向导**: 针对生产环境提供 Web 端引导式配置，简化基本 SEO 和 AI 配置。
- [ ] **访客投稿工作流 (Guest Posting) (P2)**
    - 验收: 实现投稿界面 `/submit`，集成 Turnstile 验证码进行防垃圾保护。
    - 验收: 管理后台实现投稿审核管理，支持管理员对投稿进行认领、编辑及发布。

### 4. 个性化体验深度 (Personalization)
- [ ] **主题画廊系统 (Theme Gallery) (P2)**
    - 验收: 支持用户在“自定义”主题基础上保存并命名多套独立配置。
    - 验收: 管理后台提供“主题画廊”界面，展示已保存方案的缩略信息并支持一键切换。

### 5. 播客原生支持 (Podcast Support) (P1)
- [x] **上传服务重构与音频支持**
    - 验收: 重构 `server/services/upload.ts`，支持 `image` 和 `audio` 类型校验。
    - 验收: 音频上传支持差异化限制（如 100MB），并在 `utils/shared/env.ts` 中配置。
- [x] **文章实体模型扩展**
    - 验收: `Post` 实体新增音频字段：`audioUrl`, `audioDuration`, `audioSize`, `audioMimeType`。
- [x] **播客元数据采集逻辑**
    - 验收: 实现后端辅助接口，支持通过 HEAD 请求获取远程音频的 `Content-Length` 和 `Content-Type`。
    - 验收: UI 端实现视频/音频参数配置面板，支持手动校正时长。
- [x] **多维 RSS/Podcast Feed 实现**
    - 验收: 增强 `server/utils/feed.ts`，为含音频文章自动注入 `<enclosure>` 标签。
    - 验收: 实现独立播客 Feed 路由 `/feed/podcast.xml`。
    
### 6. API 架构优化 (API Architecture Optimization) (P1)
- [x] **引入通用同步工具函数 (assignDefined)**
    - 验收: 实现 `server/utils/object.ts` 并在规范中确立“自动同步与异常处理”模式。
- [x] **Post 模块更新逻辑重构**
    - 验收: 重构 `[id].put.ts` 和 `createPostService`，移除冗余赋值判断，改为 Schema 驱动同步。
- [x] **全站 API 逻辑清理**
    - 验收: 遍历 `Category`, `Tag`, `User` 等模块的更新/创建接口，统一使用 `assignDefined`模式重构。
    - 备注: 已重构 `Category`, `Tag` 服务及 `Subscriber`, `Comment` 相关接口。`User` 模块目前主要由 `better-auth` 原生接口处理，无自定义后端更新逻辑。
- [x] **上传功能增强 (Upload Enhancement)**
    - [x] 验收: 文章封面图支持点击选择和拖拽上传.
    - [x] 验收: 音频 URL (Podcast) 支持点击选择和拖拽上传.
    - [x] 验收: 实现通用的 `AppUploader` 组件以便后续复用.

## 待规划与长期积压 (Backlog & Long-term Roadmap)

此处列出已规划但未纳入当前阶段执行的任务，用于长期版本跟踪。

### 1. 桌面端应用 (Desktop Application)

- [ ] **Tauri 跨平台应用**
    - 验收: 实现桌面客户端骨架，支持单站点/多站点管理。
    - 验收: 支持离线 Markdown 写作与间断性云端同步功能。

### 2. 精准推送与订阅 (Advanced Subscription)

- [ ] **多格式集成订阅源 (Universal Feeds)**
    - 验收: 在现有 RSS 2.0 基础上，增加对 **Atom 1.0** 和 **JSON Feed 1.1** 的原生支持。
    - 验收: 确保在所有格式中，音频附件 (Enclosure/Attachment) 均能被正确解析且不与封面图冲突。
- [ ] **维度级订阅推送**
    - 验收: 支持用户按分类/标签订阅特定邮件内容。
- [ ] **推送频率管理**
    - 验收: 实现用户的日报/周报聚合推送模式。
- [ ] **多维度订阅深度优化**
    - 验收: 实现按分类、标签导出的独立订阅源链接生成 UI。

### 3. 商业化集成 (Monetization)

- [ ] **支付与会员体系**
    - 验收: 集成 Stripe 或支付宝接口，支持针对特定内容的打赏或 Pro 会员准入。
- [ ] **流量增长与变现 (Growth & Monetization)**
    - [ ] 验收: **私域引流**: 文章详情页增加公众号关注二维码及引导说明。
    - [ ] 验收: **打赏模块**: 支持后台配置微信/支付宝收款二维码图片，并在前台页面展示。

### 4. 极客技术增强 (Geek Tech Extras)

- [ ] **可执行代码块支持**
    - 验收: 实现 Markdown 代码块在特定环境下的运行与结果输出。
- [ ] **Git 版本管理**
    - 验收: 实现文章变更的 Git Commit 化追踪，支持查看历史版本差异。

### 5. 主题生态系统 (Theme Ecosystem)

- [ ] **主题社区与发布平台**
    - 验收: 允许创作者发布、分享并由他人安装自定义主题；建立安全审核机制防范 XSS 攻击。

### 6. 其他优化项
- [ ] **文档国际化**
    - 验收: 部署指南与快速开始完成英文翻译，VitePress 站点支持双语。
- [ ] **权限安全深度校验**
    - 验收: 彻底排查并修复特定页面（如墨梅页面等）的权限逻辑漏洞。
- [ ] **感官体验增强**
    - 验收: 实现看板娘、背景粒子等可选的视觉增强开关。

### 7. 播客与多媒体原生支持 (Podcast & Multimedia)

- [ ] **播客内容管理**
    - 验收: 实现音轨上传与元数据管理，生成 Podcast RSS 订阅源。
- [ ] **音频文章协同**
    - 验收: 集成 AI TTS，为文章一键生成/刷新音频版本。
- [ ] **全站播放体验**
    - 验收: 实现全站沉浸式悬浮播放器，支持跨页面断点续播。

### 9. 高级 AI 创作流 (Advanced AI Creative Flow)
- [ ] **多模态创作增强**
    - 验收: 集成 AI 封面图生成 (DALL-E) 与 DeepL 专业协议翻译系统。
- [ ] **语音创作引擎**
    - 验收: 集成 Whisper 模型进行语音录入，并实现 AI 灵感重构（转录 ->润色 -> 博文）。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
