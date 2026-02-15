# 墨梅 (Momei) 待办事项归档 (Todo Archive)

本文档包含了墨梅博客项目中已完成或已处理的待办事项。通过归档这些历史任务，我们保持 [待办事项](./todo.md) 的简洁，使其专注于当前的开发迭代。

## 第一阶段：MVP (最小可行性产品) (已完成)

### 1. 基础设施与配置

- [x] **项目初始化**
    - 验收: Nuxt 项目结构建立，Git 仓库配置完成。
    - 验收: ESLint, Stylelint, Commitlint 配置生效。
- [x] **CI/CD 基础**
    - 验收: GitHub Actions 配置完成，PR 自动运行 Lint 和 Test。
- [x] **数据库连接**
    - 验收: 本地 SQLite 连接成功，TypeORM 实体同步正常。
- [x] **Microsoft Clarity 集成**
    - 验收: 插件安装与配置完成。
    - 验收: 环境变量支持。
- [x] **Sentry 集成**
    - 验收: 插件安装与配置完成。
    - 验收: 环境变量支持。
- [x] **百度统计集成**
    - 验收: 插件安装与配置完成。
    - 验收: 环境变量支持。
- [x] **Google Analytics 集成**
    - 验收: 插件安装与配置完成。
    - 验收: 环境变量支持。

### 2. 用户系统 (User System)

- [x] **数据库实体同步 (Database Entities)**
    - [x] 验收: 确认 `User`, `Account`, `Session`, `Verification`, `TwoFactor` 表结构正确创建。
    - [x] 验收: 数据库迁移/同步脚本执行无误。
- [x] **集成 better-auth (Backend)**
    - [x] 验收: `/api/auth/*` 路由正常工作 (SignIn, SignUp, SignOut, Session)。
    - [x] 验收: 实现 邮箱/密码 注册与登录流程；实现 用户名/密码 登录流程。
    - [x] 验收: 实现 GitHub OAuth 登录流程。 - [x] 验收: 实现 Google OAuth 登录流程。
    - [x] 验收: 用户 Session 持久化 (Cookie) 且 SSR 兼容。

- [x] **用户界面开发 (Frontend Pages)**
    - [x] 验收: **登录页 (`/login`)**: 包含邮箱登录表单和 OAuth 按钮。
    - [x] 验收: **注册页 (`/register`)**: 包含注册表单和验证逻辑。
    - [x] 验收: **个人设置页 (`/settings`)**: 允许用户修改昵称、头像。
- [x] **用户角色与权限 (RBAC)**
    - [x] 验收: 数据库 `User` 表包含 `role` 字段 (Admin, Author, User, Visitor)。
    - [x] 验收: 实现后端中间件 `server/middleware/auth.ts` 拦截未授权请求。
- [x] **用户管理 (User Management - Admin Only)**
    - [x] 验收: 管理后台提供用户列表查看功能（集成 `better-auth` admin 插件）。
    - [x] 验收: 管理员可在后台修改用户角色 (如将 User 提升为 Author)。
    - [x] 验收: 管理员可对违规账号进行禁用或启用操作。
    - [x] 验收: 支持查杀指定用户的活跃 Session。

### 3. 内容管理 (Content Management)

- [x] **Markdown 编辑器组件**
    - 验收: 支持基础 Markdown 语法高亮。
    - 验收: 支持实时预览。
- [x] **文章 CRUD API**
    - [x] 验收: `POST /api/posts` 能创建文章。
    - [x] 验收: `GET /api/posts` 能分页获取文章。
    - [x] 验收: `PUT /api/posts/:id` 能更新文章内容。
    - [x] 验收: `DELETE /api/posts/:id` 能删除文章。
    - [x] 验收: 拆分 `GET /api/posts/:id` 和 `GET /api/posts/slug/:slug`。
    - [x] 验收: Slug 设置时校验禁止使用 Snowflake ID 格式。
- [x] **文章审核流程**
    - [x] 验收: 作者发布文章后状态为 `pending` (需审核)。
    - [x] 验收: 管理员可查看所有文章列表。
    - [x] 验收: 管理员可修改文章状态。
- [x] **分类管理 (Categories)**
    - [x] 验收: API CRUD 完成 (Admin Only)。
    - [x] 验收: 管理后台界面完成 (列表/新建/编辑/删除)。
- [x] **标签管理 (Tags)**
    - [x] 验收: API CRUD 完成。
    - [x] 验收: 管理后台界面完成。
- [x] **自定义 Slug 支持**
    - [x] 验收: 创建/编辑文章时可手动输入 Slug。
    - [x] 验收: 文章可通过 `/posts/:slug` 或 `/posts/:id` 访问。
- [x] **图片上传**
    - [x] 验收: 编辑器支持拖拽上传图片。
    - [x] 验收: 图片保存到本地或对象存储，并返回可访问 URL。
- [x] **外部发布 API (External Publishing API)**
    - [x] 验收: 实现基于 API KEY 鉴权的发布接口 `POST /api/external/posts`。
    - [x] 验收: 在个人设置页增加 API 密钥管理 UI。
    - [x] 验收: 支持简单的 API KEY 管理（目前仅关联用户）。
    - [x] 验收: 外部调用能正确创建文章并关联对应作者。

### 4. 内容展示 (Content Display)

- [x] **首页开发**
    - [x] 验收: 展示文章列表，支持分页。
    - [x] 验收: 响应式布局适配移动端。
- [x] **文章详情页**
    - [x] 验收: 实现阅读量 (PV) 统计与展示 (API + Client Side + Anti-Spam)。
    - [x] 验收: Markdown 正确渲染为 HTML。
    - [x] 验收: 自动生成目录 (TOC)。
    - [x] 验收: SEO Meta 标签正确生成 (Title, Description)。
- [x] **归档页（高优先，估时 1–2 天）**
    - [x] 验收: 按年份/月份展示文章归档；支持 SSR，按年/月聚合并显示文章数量。
    - [x] 实施建议: 新增 `server/api/posts/archive.get.ts`（或扩展 `GET /api/posts`）与页面 `pages/archive.vue`（或 `pages/archives/index.vue`）。
- [x] **暗色模式 (Dark Mode)**
    - [x] 验收: 实现主题切换器 (Light/Dark/System)。
    - [x] 验收: 状态持久化 (Cookie/LocalStorage) 且无闪烁。
    - [x] 验收: 全站组件适配深色样式。
- [x] **移动端优化 (Mobile Optimization)** (高优先，估时 1–2 天)
    - [x] 验收: 实现响应式导航栏 (汉堡菜单)（估时 0.5–1 天）。
    - [x] 验收: 修正排版、间距、图片响应式，完成 Lighthouse 基本审计（估时 1–2 天）。
    - [x] 验收: 优化移动端排版 (字号、行高、间距)。
    - [x] 验收: 确保所有可点击元素尺寸符合触摸标准 (>44px)。
- [x] **测试与 CI 校验（持续）**
    - [x] 验收: 为新增归档页、移动导航添加单元/集成或 E2E 用例并纳入 CI。
- [x] **SSR 渲染支持**
    - [x] 验收: 确保首页、文章详情页、归档页在禁用 JavaScript 时能正常显示内容。
    - [x] 验收: 验证 SEO Meta 标签在服务端正确生成。
- [x] **阅读量统计 (PV)**
    - [x] 验收: 文章详情页支持阅读量累计。
    - [x] 验收: 实现基础防刷逻辑 (IP 限制或 Cookie 校验)。
    - [x] 验收: 仅统计浏览器正常访问，排除爬虫（可选）。

### 5. 国际化 (i18n)

- [x] **nuxt-i18n 配置**
    - [x] 验收: 支持 `/en` 和 `/zh` 路由前缀。
    - [x] 验收: 语言切换按钮能正确跳转并保留当前路径。
- [x] **UI 文本翻译**
    - [x] 验收: 核心组件 (Header, Footer, Card) 完成中英文配置。

---

## 第四阶段：专业化与创作进阶 (Professionalization & Creative Empowerment) (已完成)

### 1. 专业内容渲染引擎 (Rendering Engine)
- [x] **数学公式支持 ($LaTeX$) (P0)**
    - 验收: 集成 KaTeX 或 MathJax 插件，支持行内 `$x^2$` 和块级 `$$...$$` 语法渲染。
    - 验收: 确保数学公式样式在 Dark Mode 下能正确自适应且不产生布局偏移。
- [x] **Lighthouse 性能冲刺 (P0)**
    - 验收: 核心页面 (首页、文章详情) 在移动端与桌面端的 Lighthouse 性能、SEO、无障碍得分均达标 (>= 90)。
    - 验收: 实现字体加载优化 (Swap)、关键 CSS 内联及第三方脚本延迟加载。

### 2. 高级 AI 创作流 (Advanced AI Workflow)
- [x] **灵感捕捉引擎 (Inspiration Engine) (P1)**
    - 参考 [灵感捕捉引擎设计规范](../design/modules/inspiration.md)
        - [x] 验收: 实现“灵感碎片 (Snippets)” 实体模型，包含内容、媒体附件、来源元数据及状态管理。
        - [x] 验收: 实现通用的、基于令牌鉴权的 REST API，支持各类外部工具（如 cURL, 书签脚本）调用。
    - [x] 验收: **PWA 极简采集模式**: 支持“添加到主屏幕”，提供秒开即输的移动端原生化体验。
        - [x] 验收: 提供通用的“浏览器书签脚本 (Bookmarklet)”，支持一键抓取网页内容。
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

- [x] **脚手架式写作助手 (Scaffold Assistant) (P1)**
    - [x] 验收: 实现"智能大纲生成"，基于灵感片段或核心词生成 3-5 个逻辑章节建议。
    - [x] 验收: **增强智能大纲生成**:
        - 支持基于核心词生成大纲（无需已存在灵感片段）
        - 提供 4 种写作模板选择：博客文章、技术教程、个人笔记、正式报告
        - 支持自定义章节数量（3-8 个）和结构（包含引言/结论选项）
        - 支持选择目标受众级别：初级、中级、高级

    - [x] 验收: **章节论点扩充功能**:
        - 提供 5 种扩充类型：论证角度、实用案例、深度问题、引用来源、数据支撑
        - 针对大纲中的每个章节生成 3-5 个深度建议
        - 支持一键采纳建议到文章编辑器中
        - 建议采纳后保持上下文连贯性

    - [x] 验收: **前端交互增强**:
        - 在灵感列表页面升级聚合对话框，增加输入模式切换
        - 新增大纲配置面板，包含模板选择和结构选项
        - 实现章节深度分析交互界面，支持不同扩充类型切换
        - 在文章编辑器中集成大纲助手侧边栏面板 (通过一键转换与剪贴板分发)

    - [x] 验收: **后端 API 扩展**:
        - 新增 `/api/ai/scaffold/generate` 支持核心词输入和模板选项
        - 新增 `/api/ai/scaffold/expand-section` 支持章节深度扩充
        - 扩展 `AIService.generateScaffold` 方法，增强提示词模板
        - 新增章节扩充数据结构支持多种建议类型

    - [x] 验收: **数据模型与集成**:
        - 在 `Post` 实体中添加 `scaffoldOutline` 和 `scaffoldMetadata` 字段（可选）
        - 支持大纲版本管理，允许重访和调整已生成的大纲
        - 与现有灵感引擎保持完整数据链路

    - [x] 验收: **完整测试覆盖**:
        - AI 服务单元测试（增强大纲生成和论点扩充）
        - API 端点集成测试
        - 前端组件交互测试
        - 大纲生成到文章创建完整流程端到端测试

### 3. 生态准入与社会化互动 (Ecosystem & Interaction)
- [x] **极速迁移工具 (Hexo Support CLI) (P1)**
    - 验收: 开发独立的 CLI 工具或脚本，支持读取 Hexo Markdown (Front-matter)。
    - 验收: 支持通过 API Key 调用 Open API 进行批量导入。
    - 验收: 元数据映射逻辑逻辑与现有 Open API 一致，支持自动生成缺失项（参考 `/api/external/posts`）。
- [x] **安装向导与首运行初始化 (Installation Wizard) (P2)**
    - 参考 [安装向导设计规范](../design/modules/installation.md)
    - [x] 验收: **混合模式安装向导**: 针对生产环境提供 Web 端引导式配置，简化基本 SEO 和 AI 配置。
    - [x] 验收: 实现首运行检测逻辑，引导管理员创建与站点基本设置。
    - [x] 验收: 评估并实现配置持久化至数据库，处理与环境变量的优先级关系。
    - [x] 验收: 实现系统设置后台管理页面，支持多维度配置管理及安全脱敏。
- [x] **系统设置与智能混合模式增强 (System Settings & Hybrid Mode) (P1)**
    - [x] 验收: 实现“智能混合模式”逻辑，确保环境变量 (ENV) 优先级高于数据库且在 UI 中提示锁定。
    - [x] 验收: 扩展设置项：增加社交登录 (OAuth)、验证码安全 (Captcha)、系统限额 (Limits) 及品牌增强字段。
    - [x] 验收: 优化安装向导：支持安装时自动从 ENV 载入现有配置到数据库。
    - [x] 验收: 完善 Admin UI：新增“认证”、“安全”、“限额”标签页，并增加 ENV 锁定视觉反馈。
- [x] **访客投稿工作流 (Guest Posting) (P2)**
    - [x] 验收: 完成详细设计文档（参考 [互动与隐私控制](../design/modules/interactions.md)）。
    - [x] 验收: 实现投稿界面 `/submit`，集成 Turnstile 验证码进行防垃圾保护。
    - [x] 验收: 管理后台实现投稿审核管理，支持管理员对投稿进行认领、编辑及发布。

### 4. 个性化体验深度 (Personalization)
- [x] **主题画廊系统 (Theme Gallery) (P2)**
    - 参考 [主题画廊系统设计规范](../design/modules/theme-gallery.md)
    - [x] **设计与评审 (Design)**
        - 验收: 完成详细设计文档，明确 `ThemeConfig` 实体结构、API 及预览逻辑。
    - [x] **数据库模型实现**
        - 验收: 实现 `ThemeConfig` 实体，支持保存配置 JSON、预览图 Base64 及元数据。
    - [x] **后端 API 开发**
        - 验收: 实现主题方案的 CRUD 接口及“应用方案”逻辑。
    - [x] **管理后台画廊界面**
        - 验收: 实现主题卡片列表页，展示预览图、名称及描述。
        - 验收: 实现“保存当前为新方案”功能，集成前端快照截取。
        - 验收: 实现“临时预览”逻辑，支持在不生效的情况下实时查看效果。
    - [x] **国际化与测试**
        - 验收: 补齐画廊相关 i18n 文本。
        - 验收: 核心逻辑测试覆盖。

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

---

## 第二阶段：优化与增强 (Optimization & Enhancement) (已完成)

### 1. SEO 与订阅 (SEO & Subscription)

- [x] **站点地图与搜索控制台**
    - 验收: 使用 `@nuxtjs/sitemap` 自动生成 `sitemap.xml`。
    - 验收: 支持 Google/Bing Search Console 网站管理工具验证。
- [x] **订阅系统**
    - [x] 验收: 实现全局 RSS 订阅源 (`/feed.xml`)。
    - [x] 验收: 实现**多维度 RSS 订阅源** (分类/标签独立订阅源)。
    - [x] 验收: 实现 **RSS 国际化支持** (支持按语言参数过滤，并根据浏览器/阅读器 Header 自动语言探测)。
    - [x] 验收: 在分类页与标签页增加对应的 RSS 订阅链接/图标。
    - [x] 验收: 实现 RSS 自动发现 (在页面 `<head>` 注入关联链接)。
    - [x] 验收: 基础邮件订阅功能 (集成 SendGrid/Mailgun)。
- [x] **订阅系统与用户关联 (混合关联方案)**
    - 验收: 扩展 `Subscriber` 实体，增加 `userId` 关联字段（可选，指向 `User`）。
    - 验收: 优化订阅 API，若邮箱已存在于用户表，则自动关联 `userId`。
    - 验收: 实现用户注册钩子 (Registration Hook)，当新用户注册时，自动回溯并关联其历史订阅记录。
- [x] **订阅管理 (Admin Only)**
    - 验收: 管理后台提供订阅者列表查看功能 (显示邮箱、状态、加入时间、语言、**关联用户状态**)。
    - 验收: 管理员可手动删除或批量禁用订阅者账号。
    - 验收: 支持导出订阅者列表 (CSV/Excel)。

### 2. 内容体验增强 (Content Experience)

- [x] **订阅入口 (Frontend Subscription Entry)**
    - 验收: 在首页和文章详情页提供邮件订阅表单.
    - 验收: 支持已登录用户自动关联邮箱.
- [x] **阅读体验优化 (基础与进阶)**
    - [x] 验收: 文章详情页增加字数统计与阅读时长预估。
    - [x] 验收: 文章底部显示版权声明组件。
    - [x] 验收: 版权协议系统优化：支持 CC 4.0 家族及“所有权利保留”。
    - [x] 验收: 默认版权可通过环境变量 `NUXT_PUBLIC_DEFAULT_COPYRIGHT` 配置。
    - [x] 验收: 管理后台支持协议下拉选择。
    - [x] 验收: 增强预览体验：编辑页增加预览按钮，详情页增加非发布状态（草稿/待审核）的视觉提醒。
- [x] **高级搜索与过滤系统**
    - [x] 验收: 实现多维度权搜索加权检索 (标题 > 摘要 > 内容)，支持关键词、分类、标签过滤。
    - [x] 验收: 实现前端搜索对话框，支持 `Ctrl+K` 快捷键唤起。
    - [x] 验收: **性能与稳定性优化**: 移除全文检索前的并发查询强制延时，对 `summary` 和 `content` 引入最小字符阈值。
    - [x] 验收: **搜索结果聚合**: 优先显示当前语言，同源文章不重复显示。
    - [x] 验收: 数据库性能评估：在索引辅助下，万级数据量搜索响应保持在 100ms 以内。
    - [-] 验收: 集成 Algolia 或 Meilisearch 实现生产环境的全文检索（延后，当前方案已足够）。

### 3. 深度国际化 (Deep I18n)

- [x] **数据库架构与索引重构**
    - [x] 验收: Post, Category, Tag 实体引入 `(slug, language)` 复合唯一索引。
    - [x] 验收: Category 和 Tag 确保已支持 `translationId` 字段，用于关联不同语言的同名实体。
    - [x] 验收: 编写并完成 PostgreSQL/SQLite 迁移脚本。
- [x] **多语言路由与上下文感知**
    - [x] 验收: 前端所有 `useFetch` 调用自动注入当前页面的 `language` 参数。
    - [x] 验收: 实现 `/posts/hello` (默认语言) 与 `/en-US/posts/hello` (有前缀) 精准匹配。
    - [x] 验收: 兼容 `prefix_and_default` 策略，确保默认语言格在有/无前缀时均能正确识别上下文。
- [x] **内容实体的多语言翻译支持**
    - [x] 验收: 首页及文章列表页支持聚合逻辑（避免首页同一文章不同语言版本重复堆叠）。
    - [x] 验收: 确保在创建/编辑文章、分类和标签时，可以手动指定语言属性。
    - [x] 验收: 实现文章 (Posts)、分类 (Categories) 和标签 (Tags) 的跨语言 UI 关联/跳转逻辑 (Smart Language Switching)。
    - [x] 验收: 分类/标签列表页展示时支持语言过滤，避免显示非当前语言的元数据。
- [x] **管理后台国际化适配**
    - [x] 验收: 实现 UI 语言与内容语言分离模式（双语言切换控制）。
    - [x] 验收: 文章管理列表支持按内容语言筛选。
    - [x] 验收: 管理列表显示语言标识（国际化翻译标签）。
    - [x] 验收: 资源重名内容检测时支持按语言分组校验。
- [x] **前台智能导航与语言切换**
    - [x] 验收: 在文章/分类详情页切换语言时，若存在关联的翻译版本，则跳转到对应的详情 URL，而非首页。
    - [x] 验收: 实现页面的 `rel="alternate" hreflang="..."` 标签生成，提升 SEO。
- [x] **用户个性化偏好设置**
    - [x] 验收: 允许用户在设置页面持久化 UI 语言（覆盖浏览器自动检测）。
    - [x] 验收: 允许用户设置个人时区，确保全站日期按用户本地时间展示。
    - [x] 验收: 邮件订阅通知遵循用户的语言偏好。
- [x] **统一翻译管理界面 (Unified Translation Management)**
    - [x] 验收: 后台列表（文章/分类/标签）支持按“翻译簇 (Translation Cluster)”聚合展示，避免单一实体多语言版本导致列表冗长。
    - [x] 验收: 编辑弹窗支持在一个界面内切换编辑不同语言的版本（如使用 Tabs 切换）。
    - [x] 验收: 列表项显示已翻译语言、待翻译语言的标识。

### 4. AI 辅助功能 (AI Integration)

- [x] **基础设施搭建 (Infrastructure)**
    - [x] 验收: 实现统一的 AI Provider 适配器，支持 OpenAI (含 DeepSeek 等) 和 Anthropic 厂商适配。
    - [x] 验收: 完成基础环境变量配置 (API Key, Model, Endpoint)。
    - [x] 验收: 实现服务端基础 Prompt 模板工具库 (提供变量替换功能)。
    - [x] 验收: 实现服务健康检查接口，用于测试 AI Provider 是否连通。
- [x] **安全与管控 (Security & Governance)**
    - [x] 验收: **频率限制 (Rate Limiting)**: 实现基于用户角色和 IP 的调用频率限制，防止 API 滥用。
    - [x] 验收: **消耗监控**: 在后台日志中输出单次请求的 Token 消耗量。
- [x] **内容创作辅助 (Creative Assistance)**
    - [x] 验收: 实现“智能标题建议”，基于正文生成多个高点击率标题建议。
    - [x] 验收: 实现“智能 URL Slug 建议”，基于文章标题/核心内容生成简洁且 SEO 友好的 URL 别名。
    - [x] 验收: 实现“分类/标签 AI 增强”：支持基于名称自动生成 Slug 及跨语言翻译建议。
    - [x] 验收: 实现“SEO 摘要自动生成”，提取文章精华。
    - [x] 验收: 实现“智能标签推荐”，基于词库结合 AI 分析自动打标。
- [x] **国际化翻译辅助 (I18n Translation)**
    - [x] 验收: 实现“一键全文翻译”，基于 LLM 确保转换过程中 Markdown 语法、公式、代码块不损坏。
    - [x] 验收: 支持翻译预览与手动微调工作流 (通过编辑器直接修改)。
- [x] **AI 内容处理优化 (AI Content Processing)**
    - [x] 验收: 实现长文章分段处理逻辑（分段翻译、分段总结），解决超过 LLM 上下文或单次输出限制的问题。
- [x] **管理后台集成 (Admin Integration)**
    - [x] 验收: 在标题、摘要、标签处增加 AI 唤起入口。
    - [x] 验收: 实现异步处理与流式响应 (SSE) UI，提升长文本生成的交互体验。

### 5. 合规性与法律 (Compliance & Legal)

- [x] **法律文档拟定**
    - 验收: 拟定并发布 **用户协议 (User Agreement)**。
    - 验收: 拟定并发布 **隐私政策 (Privacy Policy)** (符合 Google/GitHub OAuth 审核要求)。
- [x] **合规交互实现**
    - 验收: 在 `/login` 和 `/register` 页面增加协议勾选/提示逻辑。
    - 验收: 协议内容支持通过环境变量 (`NUXT_PUBLIC_SITE_OPERATOR`, `NUXT_PUBLIC_CONTACT_EMAIL`) 进行配置。
    - 验收: **协议生效范围控制**: 通过 i18n 提供内容模板，并注明法律责任由部署者承担。

### 6. Demo 模式 (Demo Mode)

详细设计请参考: [Demo 模式设计文档](../design/modules/demo-mode.md)

- [x] **基础设施与数据库集成**
    - [x] 验收: 当 `NUXT_PUBLIC_DEMO_MODE=true` 时，强制使用 `:memory:` SQLite 数据库。
    - [x] 验收: 实现 `server/utils/seed-demo.ts`，在启动时自动填充高质量的演示数据（文章、分类、用户）。
    - [x] 验收: **自动重置逻辑**: 实现定时（如每 1 小时）或内存阈值触发的进程自杀，配合 Docker `restart: always` 实现数据重置。
- [x] **Mock AI 服务**
    - [x] 验收: 实现 `MockAIProvider`，在 Demo 模式下拦截所有 AI 调用，返回预设的高质量响应。
    - [x] 验收: 模拟打字机动画和网络延迟，保留完整的交互真实感。
- [x] **用户引导 (Onboarding)**
    - [x] 验收: 集成 `driver.js`。
    - [x] 验收: 编写 `onboarding.ts` 引导脚本，重点覆盖：自动登录、进入编辑器、唤起 AI 辅助（星星按钮）、发布文章。
- [x] **安全与拦截 (Demo Guard)**
    - [x] 验收: 完成 `server/middleware/demo-guard.ts`，拦截针对敏感配置（环境变量、系统密钥）的修改。
    - [x] 验收: 修改成功提示中增加“数据将在重启后重置”的文案。
- [x] **前端演示标识**
    - [x] 验收: 在页面显著位置（如 Header 或侧边栏）显示 Demo 状态 Banner。
    - [x] 验收: 提供“开始演示”按钮随时触发新手引导。

---

## 第三阶段：专注与深耕 (Focus & Depth) (已完成)

### 1. 主题与定制化系统 (Themes & Customization)

- [x] **基础设施与数据库集成**
    - 验收: 实现 `Setting` 实体及基础 CRUD 服务。
    - 验收: 实现主题配置的缓存机制，减少页面渲染时的数据库查询。
- [x] **外观定制能力**
    - 验收: 实现主题预设 (Presets) 切换功能。
    - 验收: 实现主色调 (Primary Color) 的可视化微调。
    - 验收: 实现圆角 (Border Radius) 的全局设置。
- [x] **品牌识别系统**
    - 验收: 管理后台支持上传/更换站点 Logo。
    - 验收: 管理后台支持上传/更换 Favicon。
- [x] **特殊模式与背景**
    - 验收: 实现“哀悼模式”开关，全站一键置灰。
    - 验收: 支持自定义背景图片或预设渐变。
- [x] **管理后台界面**
    - 验收: 在侧边栏新增“主题定制”入口。
    - 验收: 提供预览功能，实现在保存前查看主题效果。
- [x] **主题与科技感升级**
    - 验收: 修改原“即刻”主题为“极客紫”，优化科技感色彩与对比度。
    - 验收: 提升主题定制页面的表单间距与 UI 体验。
- [x] **自定义主题支持**
    - 验收: 引入“自定义”主题预设，允许用户在此基础上灵活调整并持久化个人配置。
- [x] **部署优化**
    - 验收: **优化部署文档**: 简化安装步骤，提供清晰的 Docker Compose 部署范例。
    - 验收: 实现针对主流 Serverless 平台的一键部署配置。
    - 验收: 实现环境变量智能推断（数据库类型、Secret 自动生成、功能自动激活）。
    - 验收: 精简 `.env.example`，区分必填与选填项。
- [x] **样式权重平衡 (Specificity Balancing)**
    - 验收: 研究并在文档中制定解决“禁止使用 `!important`”规范与“用户自定义 CSS 注入”之间权重冲突的方案。
- [x] **安全加固: 自定义内容来源校验**
    - 验收: 已实现针对自定义 Logo、Favicon、文章封面图及背景图的 URL 白名单校验，支持前后端同步验证。

### 2. 互动与隐私控制 (Interactions & Privacy Control)

- [x] **精细化文章访问权限控制**
    - [x] 验收: 数据库 `Post` 实体增加 `visibility` (枚举: public, private, password, registered, subscriber) 和 `password` (可选) 字段。
    - [x] 验收: 实现后端访问检查逻辑，非符合条件请求仅返回元数据，隐藏正文。
    - [x] 验收: 实现前端访问校验 UI，包含密码输入框、登录引导或订阅引导。
- [x] **原生评论系统**
    - [x] 验收: 数据库 `Comment` 实体实现，包含父子级、作者信息（访客/注册用户）、IP、状态等字段。
    - [x] 验收: 实现评论 CRUD API，支持嵌套获取、点赞、删除。
    - [x] 验收: 实现前台评论列表与发表组件，支持 Markdown 预览与 Gravatar 头像。
    - [x] 验收: 管理后台集成评论管理，支持批量审核、标记垃圾与黑名单封断。
- [x] **增强评论系统隐私与安全**
    - [x] 验收: 实现评论接口隐私过滤，非 Admin 角色请求 API 时自动脱敏邮箱字段。
    - [x] 验收: 实现分级审核逻辑：游客评论必审，注册用户评论直发。
    - [x] 验收: 实现 Cookie 标识游客身份，确保游客能查看自己待审核的评论而不暴露邮箱给他人或泄露在 URL 中。
    - [x] 验收: (高优先) 集成验证码系统 (支持 Cloudflare Turnstile, Google reCAPTCHA 等)。

### 3. 架构增强与文档（Architecture & Docs）

- [x] **高性能 PV 统计优化**
    - [x] 验收: 实现基于内存缓存的批量写入逻辑，降低高流量下数据库主表更新压力。
- [x] **存储系统进化**
    - [x] 验收: 实现 `LocalStorage`适配器，并完善 Serverless 环境冲突卫兵检测逻辑。
    - [x] 验收: 实现磁盘空间监控与超限保护。
    - [x] 验收: 实现上传文件类型严格校验 (仅限图片)。
- [x] **备案信息展示 (Regional Compliance)**
    - 验收: 支持在 `app-footer.vue` 中配置并显示 **ICP 备案号** 和 **公安网安备号**（含图标）。
    - 验收: 链接正确跳转至工信部及公安备案查询平台。

### 4. 内容呈现与质量增强 (Content Rendering & Quality Enhancement)

详细设计请参考: [内容呈现增强设计文档](../design/modules/rendering.md)

- [x] **Lighthouse 性能跑分优化 (High Priority)**
    - [x] 验收: 在 CI 工作流中集成 Lighthouse CI，实现自动化性能监控。
    - [x] 验收: 基础图片优化 (WebP 支持、懒加载) 落地。
- [x] **代码块语法高亮 (High Priority)**
    - [x] 验收: 文章正文中的代码块支持语法高亮（推荐集成 Shiki 或 highlight.js）。
    - [x] 验收: 支持主流编程语言 (JS/TS, Python, Java, Go, Rust 等)。
- [x] **图片懒加载 (High Priority)**
    - [x] 验收: 文章图片默认开启懒加载，提升页面性能。
    - [x] 验收: 兼容现代浏览器的 `loading="lazy"` 属性或集成 `Intersection Observer` 方案。
- [x] **Markdown 格式化 (Medium Priority)**
    - [x] 验收: 实现对 Markdown 内容的自动化格式化与美化（集成 @lint-md/core）。
    - [x] 验收: 支持在编辑器内自动格式化，确保排版整洁一致。
- [x] **富媒体与交互渲染能力增强 (Medium Priority)**
    - [x] **自定义容器**: 集成 `markdown-it-container` 插件，支持 `::: tip/warning/danger/info` 等容器及自定义标题。
    - [x] **代码组支持**: 实现类似 VitePress 的 Code Group 功能，支持 Tab 切换多段代码。
    - [x] **GitHub 警报语法**: 支持渲染 `> [!NOTE]` 等标注式警报。
    - [x] **Emoji 渲染**: 集成 `markdown-it-emoji` 插件支持标准表情符号。
    - [x] **Lightbox 增强**: 实现点击图片弹出大图预览功能。

### 5. 系统细节优化与稳定性 (Refinement & Stability)

- [x] **动态登录方式显示**
    - 验收: UI 自动根据 `.env` 中是否包含 `NUXT_PUBLIC_GITHUB_CLIENT_ID` 等公共环境变量决定是否渲染对应按钮。
- [x] **迁移数据继承支持**
    - 验收: 修改文章创建 API，支持可选的 `createdAt` 和 `views` 字段（仅限 Admin 角色）。
- [x] **文档与 AI 协同增强**
    - 验收: 更新 `docs/` 下的开发手册，增加 AI Agent (如本项目中的 QA Assistant) 使用指南及开发最佳实践。
- [x] **管理员账号初始化优化**
    - 验收: 实现系统空状态检测，首个成功注册的用户自动获得 `Admin` 角色。
- [x] **中间件性能优化**
    - 验收: 实现 `server/middleware` 中的数据上下文挂载，避免后续 handler 重复调用 `getSession`。
- [x] **头像系统优化**
    - 验收: 默认头像加载逻辑优化，优先使用 Gravatar，并确保在各种网络环境下的稳定性。
- [x] **Copilot Hooks 集成**
    - 验收: 配置 .github/hooks/momei.json。
    - 验收: 实现安全拦截 (Secret, Dangerous Cmd)、规范拦截 (any, !important)。
    - 验收: 实现自动 Lint 修复与会话总结日志。

### 6. 运维与部署优化 (Ops & Deployment Optimization)

- [x] **环境变量智能化推断 (Smart Environment Inference)**
    - [x] 验收: 实现从 `DATABASE_URL` 自动推断 `DATABASE_TYPE`。
    - [x] 验收: 实现开发环境下 `AUTH_SECRET` 自动生成。
    - [x] 验收: 实现基于 API Key 存在的 AI 功能自动激活。
- [x] **零配置本地开发体验 (Zero-Config Development)**
    - [x] 验收: 提供默认本地 SQLite 路径，支持不创建 `.env` 直接运行。
- [x] **分层环境变量管理**
    - [x] 验收: 重构 `.env.example`，区分“核心”与“增强”变量。

## 第五阶段：生态深化与体验极致 (Ecosystem Deepening & Extreme Experience) (已完成)

### 1. 订阅中心与通知系统 (Subscription Hub & Notification System) (P1)
具体文档：[订阅中心与通知系统](../design/modules/notifications.md)
- [x] **多格式集成订阅源 (Universal Feeds)**
    - 验收: 在现有 RSS 2.0 基础上，增加对 **Atom 1.0** 和 **JSON Feed 1.1** 的原生支持。
    - 验收: 确保在所有格式中，音频附件 (Enclosure/Attachment)均能被正确解析且不与封面图冲突。
- [x] **多维订阅管理中心 (Subscription Management)**
    - 验收: 在用户设置中增加"订阅管理"页签，允许用户查看当前订阅状态。
    - 验收: **维度级订阅**: 支持用户按分类/标签勾选感兴趣的内容，实现精准推送。
    - 验收: 提供"一键取消订阅"功能。
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
        - [x] 文章发布确认框增加"推送选项"（不推送/存为草稿/立即发送）。
        - [x] 实现首次发布时的逻辑分支，确保不同步误发。
        - [x] 文章管理页增加"再次推送到邮件"操作，支持预设内容。
    - [x] 验收: **管理员站务接收**: 后台增加管理员通知配置页，涵盖新用户、新评论、API 错误及系统警报。
- [x] **邮件模板与队列优化 (Templates & Queue)** (P2)
    - [x] 验收: **卡片式 HTML 模板引擎**: 实现基于 `table` 布局的 HTML 模板，支持封面图卡片展示。
    - [x] 验收: **发送前测试**: 增加"发送预览邮件到管理员邮箱"的功能，确保渲染正确。
    - [x] 验收: **变量替换引擎**: 实现支持多语言（$t）和自定义变量（{{articleTitle}}）的替换逻辑。
- [x] **营销推送定时化 (Scheduled Marketing)** (P1)
    - 验收: **通用定时引擎**: 升级任务引擎，支持扫描 `SCHEDULED` 状态的营销任务。
    - 验收: **定时设置**: 营销编辑页面支持设置计划发送时间。
    - 验收: **状态流转**: 实现从 `DRAFT` 到 `SCHEDULED` 再到 `COMPLETED/FAILED` 的完整自动化流。

### 2. 商业化集成 (Monetization) (P2)
- [x] **流量增长与变现 (Growth & Monetization)**
    - [x] 验收: **多维度显隐控制**: 支持按当前页面语言 (zh-CN/en-US) 动态决定外链/打赏码的展示与隐藏。
    - [x] 验收: **后台商业配置优化**: 提取共享组件 CommercialLinkManager 实现代码复用，并增加权限校验 (RBAC)。
    - [x] 验收: **社交链接与打赏集成**: 实现基于"个人配置+全局覆盖"的社交引流与赞助系统。
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
    - [x] 验收: **AI 联动润色**: 提供"一键 AI 优化"动作，将识别出的口语文本通过现有 AI 路由转化为书面博文片段。
    - [x] 验收: **回退机制**: 针对不支持 Web Speech API 的浏览器提供优雅降级方案。

### 4. 高级 AI 创作流 (Advanced AI Creative Flow) (P1)
- [x] **多模态创作增强 (AI 图像生成)**
    - [x] 意图分析与技术架构方案设计 (已移除 DeepL 专项集成，统一使用 AI 翻译)
    - [x] **统一 AI 图像 API 入口**: 扩展 `AIProvider` 接口支持 `generateImage` 动作。
    - [x] **异步任务处理系统**: 实现基于数据库轮询的任务状态追踪机制，解决 Serverless 环境下的超时问题。
    - [x] **多模型适配**:
        - [x] 实现 **豆包 (Doubao-Seedream-4.5)** 驱动适配（当前主选，已验证）。
        - [x] 实现 OpenAI DALL-E 3 驱动（代码已就绪，待测试）。
        - [x] 确保所有驱动支持自定义 API Endpoint。
    - [x] **图像持久化**: 自动下载 AI 生成的临时 URL 到本地存储，防止过期。
    - [x] **前端 UI 实现**: 增加"AI 生成封面"入口，支持提示词输入、模型选择与实时生成预览。

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
- [x] **Anthropic MCP Server 实现**
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
    - [x] 验收: **发布状态重定位**: 将文章发布状态标签移至"发布"按钮旁，与操作逻辑对齐。
    - [x] 验收: **语言切换器优化**: 重构顶部语言切换逻辑，使其更符合直觉。
    - [x] 验收: **"同步"图标纠偏**: 将微信/多平台同步按钮图标更改为 `pi-sync`，明确"同步"而非"分享"语义。
    - [x] 验收: **设置侧边栏交互升级**:
        - [x] 将 Drawer 改为自定义侧边栏（不产生遮罩）。
        - [x] 实现内容区随侧边栏开关的平滑位移动画，头部工具栏不再被遮挡。
        - [x] 新建文章时侧边栏默认展开，并支持"精简"与"标准"两种宽度切换。
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
    - 验收: 为"定时发布"与"AI 异步任务"补全 Mermaid 流程图。
- [x] **全局链接与术语优化 (Cleanup)**
    - 验收: 修复全站 MD 链接失效，规范化"翻译簇"、"发布意图"等核心术语。

### 10. 文档国际化 (Documentation Internationalization) (P1)
- [x] **i18n 基础架构搭建 (Base Infrastructure)**
    - 验收: 完成 VitePress 多语言配置，实现 URL 前缀路由控制。
- [x] **英文站点脚手架 (English Docs Scaffolding)**
    - 验收: 初始化 `docs/en-US/` 目录并同步核心目录结构。
- [x] **核心文档首轮翻译 (Core Translation)**
    - 验收: 完成首页、快速开始、部署指南、功能特性的首轮人工/AI 协同翻译。
- [x] **动态文档同步策略 (Sync Strategy)**
    - 验收: 制定 `README.md` 等文件的双语滚动更新机制，确保一致性。
