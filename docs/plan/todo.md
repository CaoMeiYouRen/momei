# 墨梅 (Momei) 待办事项 (Todo List)

本文档列出了当前阶段 (MVP) 需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开。

## 状态说明

-   [ ] 待办 (Todo)
-   [x] 已完成 (Done)
-   [-] 已取消 (Cancelled)

## 第一阶段：MVP (最小可行性产品) (已完成)

### 1. 基础设施与配置

-   [x] **项目初始化**
    -   验收: Nuxt 3 项目结构建立，Git 仓库配置完成。
    -   验收: ESLint, Stylelint, Commitlint 配置生效。
-   [x] **CI/CD 基础**
    -   验收: GitHub Actions 配置完成，PR 自动运行 Lint 和 Test。
-   [x] **数据库连接**
    -   验收: 本地 SQLite 连接成功，TypeORM 实体同步正常。
-   [x] **Microsoft Clarity 集成**
    -   验收: 插件安装与配置完成。
    -   验收: 环境变量支持。
-   [x] **Sentry 集成**
    -   验收: 插件安装与配置完成。
    -   验收: 环境变量支持。
-   [x] **百度统计集成**
    -   验收: 插件安装与配置完成。
    -   验收: 环境变量支持。
-   [x] **Google Analytics 集成**
    -   验收: 插件安装与配置完成。
    -   验收: 环境变量支持。

### 2. 用户系统 (User System)

-   [x] **数据库实体同步 (Database Entities)**
    -   [x] 验收: 确认 `User`, `Account`, `Session`, `Verification`, `TwoFactor` 表结构正确创建。
    -   [x] 验收: 数据库迁移/同步脚本执行无误。
-   [x] **集成 better-auth (Backend)**

    -   [x] 验收: `/api/auth/*` 路由正常工作 (SignIn, SignUp, SignOut, Session)。
    -   [x] 验收: 实现 邮箱/密码 注册与登录流程；实现 用户名/密码 登录流程。
    -   [x] 验收: 实现 GitHub OAuth 登录流程。 - [x] 验收: 实现 Google OAuth 登录流程。
    -   [x] 验收: 用户 Session 持久化 (Cookie) 且 SSR 兼容。

-   [x] **用户界面开发 (Frontend Pages)**
    -   [x] 验收: **登录页 (`/login`)**: 包含邮箱登录表单和 OAuth 按钮。
    -   [x] 验收: **注册页 (`/register`)**: 包含注册表单和验证逻辑。
    -   [x] 验收: **个人设置页 (`/settings`)**: 允许用户修改昵称、头像。
-   [x] **用户角色与权限 (RBAC)**
    -   [x] 验收: 数据库 `User` 表包含 `role` 字段 (Admin, Author, User, Visitor)。
    -   [x] 验收: 实现后端中间件 `server/middleware/auth.ts` 拦截未授权请求。
-   [x] **用户管理 (User Management - Admin Only)**
    -   [x] 验收: 管理后台提供用户列表查看功能（集成 `better-auth` admin 插件）。
    -   [x] 验收: 管理员可在后台修改用户角色 (如将 User 提升为 Author)。
    -   [x] 验收: 管理员可对违规账号进行禁用或启用操作。
    -   [x] 验收: 支持查杀指定用户的活跃 Session。

### 3. 内容管理 (Content Management)

-   [x] **Markdown 编辑器组件**
    -   验收: 支持基础 Markdown 语法高亮。
    -   验收: 支持实时预览。
-   [x] **文章 CRUD API**
    -   [x] 验收: `POST /api/posts` 能创建文章。
    -   [x] 验收: `GET /api/posts` 能分页获取文章。
    -   [x] 验收: `PUT /api/posts/:id` 能更新文章内容。
    -   [x] 验收: `DELETE /api/posts/:id` 能删除文章。
    -   [x] 验收: 拆分 `GET /api/posts/:id` 和 `GET /api/posts/slug/:slug`。
    -   [x] 验收: Slug 设置时校验禁止使用 Snowflake ID 格式。
-   [x] **文章审核流程**
    -   [x] 验收: 作者发布文章后状态为 `pending` (需审核)。
    -   [x] 验收: 管理员可查看所有文章列表。
    -   [x] 验收: 管理员可修改文章状态。
-   [x] **分类管理 (Categories)**
    -   [x] 验收: API CRUD 完成 (Admin Only)。
    -   [x] 验收: 管理后台界面完成 (列表/新建/编辑/删除)。
-   [x] **标签管理 (Tags)**
    -   [x] 验收: API CRUD 完成。
    -   [x] 验收: 管理后台界面完成。
-   [x] **自定义 Slug 支持**
    -   [x] 验收: 创建/编辑文章时可手动输入 Slug。
    -   [x] 验收: 文章可通过 `/posts/:slug` 或 `/posts/:id` 访问。
-   [x] **图片上传**
    -   [x] 验收: 编辑器支持拖拽上传图片。
    -   [x] 验收: 图片保存到本地或对象存储，并返回可访问 URL。
-   [x] **外部发布 API (External Publishing API)**
    -   [x] 验收: 实现基于 API KEY 鉴权的发布接口 `POST /api/external/posts`。
    -   [x] 验收: 在个人设置页增加 API 密钥管理 UI。
    -   [x] 验收: 支持简单的 API KEY 管理（目前仅关联用户）。
    -   [x] 验收: 外部调用能正确创建文章并关联对应作者。

### 4. 内容展示 (Content Display)

-   [x] **首页开发**
    -   [x] 验收: 展示文章列表，支持分页。
    -   [x] 验收: 响应式布局适配移动端。
-   [x] **文章详情页**
    -   [x] 验收: 实现阅读量 (PV) 统计与展示 (API + Client Side + Anti-Spam)。
    -   [x] 验收: Markdown 正确渲染为 HTML。
    -   [x] 验收: 自动生成目录 (TOC)。
    -   [x] 验收: SEO Meta 标签正确生成 (Title, Description)。
-   [x] **归档页（高优先，估时 1–2 天）**
    -   [x] 验收: 按年份/月份展示文章归档；支持 SSR，按年/月聚合并显示文章数量。
    -   [x] 实施建议: 新增 `server/api/posts/archive.get.ts`（或扩展 `GET /api/posts`）与页面 `pages/archive.vue`（或 `pages/archives/index.vue`）。
-   [x] **暗色模式 (Dark Mode)**
    -   [x] 验收: 实现主题切换器 (Light/Dark/System)。
    -   [x] 验收: 状态持久化 (Cookie/LocalStorage) 且无闪烁。
    -   [x] 验收: 全站组件适配深色样式。
-   [x] **移动端优化 (Mobile Optimization)** (高优先，估时 1–2 天)
    -   [x] 验收: 实现响应式导航栏 (汉堡菜单)（估时 0.5–1 天）。
    -   [x] 验收: 修正排版、间距、图片响应式，完成 Lighthouse 基本审计（估时 1–2 天）。
    -   [x] 验收: 优化移动端排版 (字号、行高、间距)。
    -   [x] 验收: 确保所有可点击元素尺寸符合触摸标准 (>44px)。
-   [x] **测试与 CI 校验（持续）**
    -   [x] 验收: 为新增归档页、移动导航添加单元/集成或 E2E 用例并纳入 CI。
-   [x] **SSR 渲染支持**
    -   [x] 验收: 确保首页、文章详情页、归档页在禁用 JavaScript 时能正常显示内容。
    -   [x] 验收: 验证 SEO Meta 标签在服务端正确生成。
-   [x] **阅读量统计 (PV)**
    -   [x] 验收: 文章详情页支持阅读量累计。
    -   [x] 验收: 实现基础防刷逻辑 (IP 限制或 Cookie 校验)。
    -   [x] 验收: 仅统计浏览器正常访问，排除爬虫（可选）。

### 5. 国际化 (i18n)

-   [x] **nuxt-i18n 配置**
    -   [x] 验收: 支持 `/en` 和 `/zh` 路由前缀。
    -   [x] 验收: 语言切换按钮能正确跳转并保留当前路径。
-   [x] **UI 文本翻译**
    -   [x] 验收: 核心组件 (Header, Footer, Card) 完成中英文配置。

## 第二阶段：优化与增强 (Optimization & Enhancement)

### 1. SEO 与订阅 (SEO & Subscription)

-   [x] **站点地图与搜索控制台**
    -   验收: 使用 `@nuxtjs/sitemap` 自动生成 `sitemap.xml`。
    -   验收: 支持 Google/Bing Search Console 网站管理工具验证。
-   [x] **订阅系统**
    -   验收: 实现 RSS 订阅源 (`/feed.xml` 或 `/rss.xml`)。
    -   验收: 基础邮件订阅功能 (集成 SendGrid/Mailgun)。
-   [x] **订阅系统与用户关联 (混合关联方案)**
    -   验收: 扩展 `Subscriber` 实体，增加 `userId` 关联字段（可选，指向 `User`）。
    -   验收: 优化订阅 API，若邮箱已存在于用户表，则自动关联 `userId`。
    -   验收: 实现用户注册钩子 (Registration Hook)，当新用户注册时，自动回溯并关联其历史订阅记录。
-   [x] **订阅管理 (Admin Only)**
    -   验收: 管理后台提供订阅者列表查看功能 (显示邮箱、状态、加入时间、语言、**关联用户状态**)。
    -   验收: 管理员可手动删除或批量禁用订阅者账号。
    -   验收: 支持导出订阅者列表 (CSV/Excel)。

### 2. 内容体验增强 (Content Experience)

-   [x] **订阅入口 (Frontend Subscription Entry)**
    -   验收: 在首页和文章详情页提供邮件订阅表单。
    -   验收: 支持已登录用户自动关联邮箱。
-   [x] **阅读体验优化 (基础与进阶)**
    -   [x] 验收: 文章详情页增加字数统计与阅读时长预估。
    -   [x] 验收: 文章底部显示版权声明组件。
    -   [x] 验收: 版权协议系统优化：支持 CC 4.0 家族及“所有权利保留”。
    -   [x] 验收: 默认版权可通过环境变量 `NUXT_PUBLIC_DEFAULT_COPYRIGHT` 配置。
    -   [x] 验收: 管理后台支持协议下拉选择。
    -   [x] 验收: 增强预览体验：编辑页增加预览按钮，详情页增加非发布状态（草稿/待审核）的视觉提醒。
-   [x] **高级搜索与过滤系统**
    -   [x] 验收: 实现多维度搜索接口 (`GET /api/search`)，支持关键词、分类、标签过滤。
    -   [x] 验收: 搜索结果支持多语言聚合（优先显示当前语言，同源文章不重复显示）。
    -   [x] 验收: 实现前端搜索对话框，支持 `Ctrl+K` 快捷键唤起。
    -   [x] 验收: 针对数据库性能进行优化（增加索引、优化 `LIKE` 范围、加强频率限制）。
    -   [-] 验收: 集成 Algolia 或 Meilisearch 实现生产环境的全文检索（延后，当前方案已足够）。

### 3. 深度国际化 (Deep I18n)

-   [ ] **数据库架构与索引重构**
    -   验收: 修改 `Post`, `Category`, `Tag` 实体，将 `slug` 的唯一索引改为 `(slug, language)` 联合唯一。
    -   验收: `Category` 和 `Tag` 确保已支持 `translationId` 字段，用于关联不同语言的同名实体。
    -   验收: 编写并测试相应的数据库迁移脚本。
-   [ ] **内容实体的多语言翻译支持**
    -   验收: 实现分类 (Categories) 和标签 (Tags) 的跨语言关联逻辑。
    -   验收: 确保在创建/编辑分类和标签时，可以指定语言并关联到已有的翻译版本。
-   [ ] **管理后台国际化适配**
    -   验收: 文章、分类、标签的管理列表均显示语言标识（如国旗图标或 BCP47 代码）。
    -   验收: 后台列表支持按语言快速筛选内容。
    -   验收: 用户管理列表显示用户偏好语言。
-   [ ] **前台智能导航与语言切换**
    -   验收: 在文章/分类详情页切换语言时，若存在关联的翻译版本，则跳转到对应的详情 URL，而非首页。
    -   验收: 实现页面的 `rel="alternate" hreflang="..."` 标签生成，提升 SEO。
-   [ ] **用户个性化偏好设置**
    -   验收: 允许用户在设置页面持久化 UI 语言（覆盖浏览器自动检测）。
    -   验收: 允许用户设置个人时区，确保全站日期（归档、发布时间）按用户本地时间展示。
    -   验收: 邮件订阅通知（如 RSS 更新提示）遵循用户的语言偏好。

### 4. AI 辅助功能 (AI Integration)

-   [ ] **内容辅助**
    -   验收: 在管理后台集成 AI 标题生成建议。
    -   验收: 提供 AI 辅助内容翻译功能 (集成 OpenAI/DeepL API)。

### 5. 主题与定制化 (Themes & Customization)

-   [ ] **主题系统重构**
    -   验收: 实现核心逻辑与样式的进一步解耦，支持多主题切换。
    -   验收: 管理后台支持选择和基本配置当前主题。
-   [ ] **个性化定制**
    -   验收: 支持管理员在后台注入自定义 CSS/SCSS。
-   [ ] **特色视觉**
    -   验收: 实现哀悼模式 (全站置灰功能)。

### 6. 性能优化与商业化 (Performance & Monetization)

-   [ ] **性能提升**
    -   验收: 优化集成测试运行速度 (解决 SQLite/Auth 测试缓慢问题)。
-   [ ] **支付集成**
    -   验收: 集成 Stripe 或支付宝支付接口 (用于打赏或 Pro 套餐)。

### 7. 合规性与法律 (Compliance & Legal)

-   [ ] **法律文档拟定**
    -   验收: 拟定并发布 **用户协议 (User Agreement)**。
    -   验收: 拟定并发布 **隐私政策 (Privacy Policy)** (符合 Google/GitHub OAuth 审核要求)。
-   [ ] **合规交互实现**
    -   验收: 在 `/login` 和 `/register` 页面增加协议勾选/提示逻辑。

### 8. Demo 模式 (Demo Mode)

-   [ ] **实现 Demo 模式服务端拦截器**
    -   验收: 完成 `server/middleware/demo-guard.ts`，基于白名单拦截所有非 GET 请求。
    -   验收: 确保敏感管理 API (如用户删除、权限设置) 在 Demo 模式下被强制拦截。
-   [ ] **内存数据库集成**
    -   验收: 设置 `DATABASE_TYPE=sqlite` 且不指定路径时，自动使用内存模式 (或根据 `DEMO_MODE` 环境变强制置)。
    -   验收: 重启应用后数据能够完全重置。
-   [ ] **前端演示标识**
    -   验收: 当 `NUXT_PUBLIC_DEMO_MODE=true` 时，在页面顶部或侧边栏显示“当前为演示模式，修改不会被保存”的提醒。

## 特色功能集 (Feature Sets)

### 1. 搜索功能优化 (Search Optimization)

-   [x] **内核级检索逻辑增强**
    -   验收: 移除全文检索前的 50ms 强制延时 (改为真正的并发查询)。
    -   验收: 实现多字段加权搜索 (标题 > 摘要 > 内容)。
    -   验收: 对 `summary` 和 `content` 引入最小字符阈值 (2 个字符) 以触发内容检索，保护数据库性能。
-   [x] **安全与稳定性**
    -   验收: 搜索接口速率限制 (Rate Limiting) 升级为 20 req/min。
    -   验收: 处理异常 SQL 注入风险 (通过 TypeORM 参数化绑定)。
-   [x] **数据库性能评估**
    -   验收: 在 GIN/B-Tree 索引辅助下，万级数据量搜索响应时间应保持在 100ms 以内。

### 2. 深层国际化 (Deep I18n)

-   [x] **数据库架构与索引重构**
    -   验收: Post/Category/Tag 实体引入 `(slug, language)` 复合唯一索引。
    -   验收: 提供 PostgreSQL 迁移脚本用于变更现有的单字段唯一索引。
-   [x] **多语言路由与上下文感知**
    -   验收: 前端所有 `useFetch` 调用自动注入当前页面的 `language` 参数。
    -   验收: 实现 `/posts/hello` (默认语言，无前缀) 与 `/en-US/posts/hello` (英语，有前缀) 共存且精准匹配。
    -   验收: 兼容 `prefix_and_default` 策略，确保默认语言在有/无前缀时均能正确识别上下文。
-   [ ] **多语言列表聚合**
    -   验收: 首页列表支持按当前语言过滤。
    -   验收: 分类/标签列表页支持语言过滤，避免显示非当前语言的元数据。
-   [ ] **管理后台 I18n 适配**
    -   验收: 文章编辑器支持快速切换语言属性。
    -   验收: 资源重名检查时支持按语言分组校验。

## 待排期 (Backlog)

### 文档与支持 (Documentation & Support)

-   [ ] **用户手册国际化 (I18n for User Docs)**
    -   验收: 部署指南 (`deploy.md`) 和快速开始 (`quick-start.md`) 完成英文翻译。
    -   验收: VitePress 站点支持切换 `en-US` 和 `zh-CN` 文档。

### 创新功能 (Innovation)

-   [ ] Tauri 桌面端应用 (离线写作/本地管理)。
-   [ ] AI 自动摘要生成。
-   [ ] 评论系统 (社区互动)。
-   [ ] 访客投稿流程。

### 性能与架构优化 (Performance & Architecture)

-   [ ] **阅读量 (PV) 统计性能优化**
    -   验收: 当单日阅读量上升到一定量级时，将 `views` 字段的高频更新从数据库索引维护中解耦。
    -   验收: 实现 Redis 缓存计数器或消息队列异步批量写入方案，减少对 `Post` 表索引的写入压力。
    -   验收: 确保即便采用异步方案，排序（按阅读量）功能依然能保持最终一致性。

## 相关文档

-   [AI 代理配置](../../AGENTS.md)
-   [项目计划](./roadmap.md)
-   [开发规范](../standards/development.md)
-   [UI 设计](../design/ui.md)
-   [API 设计](../design/api.md)
-   [测试规范](../standards/testing.md)
