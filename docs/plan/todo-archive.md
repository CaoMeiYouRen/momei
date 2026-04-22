# 墨梅博客 待办事项归档 (Todo Archive)

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

---

## 第六阶段：全方位体验与创作精修 (Global Experience & Creative Refinement) (已完成)

> **当前阶段**: Phase 6
> **核心目标**: 强化创作安全感、提升多媒体生产力，并优化极客阅读交互。

### 1. 创作安全增强 (Creative Security & Resilience) (P0) (已完成)
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

### 2. 播客与多媒体生产力 (Advanced Multimedia & AI) (P1) (已完成)
- [x] **文章音频化系统 (Audio-ization System)** (P1)
    - [x] **Phase 1: 核心基础与数据库支持**
        - [x] 重构 `AITask` 实体，合并 `TTSTask` 实现通用任务管理
        - [x] 扩展 `Post` 实体中的 TTS 相关字段
        - [x] 实现 TTS 服务抽象接口与 OpenAI 提供者
        - [x] 实现简单的异步任务处理逻辑
    - [x] **Phase 2: 页面集成与 API**
        - [x] 实现 `POST /api/posts/:id/tts` 生成接口
        - [x] 实现 `GET /api/tasks/tts/:id` 状态查询接口
        - [x] 文章编辑器侧边栏增加音频设置面板与生成对话框
    - [x] **Phase 3: 其他提供者与播客模式 (部分延迟/下线)**
        - [x] 实现 火山引擎 (豆包) 提供者 (V3 HTTP) (由于接口对接问题，暂时下线并隐藏)
        - [-] 实现 AI 播客 (Podcast) 模式生成逻辑 (延迟至后续阶段)
        - [-] 音频元数据保存与 RSS Enclosure 自动关联
- [x] **AI 基础设施重构 (AI Infrastructure Refactoring)** (P1)
    - [x] **API 路径统一**: 将 TTS 移至 `/api/ai/tts`，统一 ASR 风格。
    - [x] **权限松绑**: ASR/TTS API 支持 Author 角色。
    - [x] **逻辑分层**: Provider 驱动移至 `utils`，业务逻辑保留在 `services`。
    - [x] **配置外露**: 公共环境变量集成至 `public.get.ts`。
    - [x] **验收点**:
        - 验收: 实现统一的音频化控制器，支持 **标准 TTS** 与 **AI 播客 (Dual Human)** 模式。
        - 验收: 编辑器增加“生成音频”功能，支持选择提供者 (OpenAI/Azure/SiliconFlow)。 (火山引擎已隐藏)
        - [-] 验收: 集成 **火山引擎 (豆包)** WebSocket V3 接口，支持流式生成播客音频。 (由于接口限制，暂时作为积压项延迟)
        - 验收: 生成的音频自动保存并作为 RSS 的 Enclosure 附件发布。
- [x] **高精度语音转录驱动演进 (AI Voice Transcription)**
    - 验收: 实现 Web Speech API (基础) 作为默认识别模式，提供低功耗、零延迟体验。
    - 验收: 移除离线 Transformers.js 降级方案，保持包体轻量。
- [x] **云端语音识别系统 (Cloud ASR Hub)** (P1)
    - 验收: 实现 **SiliconFlow (Batch)** 驱动，支持上传录音文件进行全文精确转录。
    - 验收: 成功修复 SiliconFlow 400 错误并通过语言代码标准化提高兼容性。
    - [-] 验收: 实现 **Volcengine (Streaming)** 驱动，支持通过 WebSocket 进行流式实时对讲。 (由于接口问题暂时下线并移回积压项)
    - 验收: 优化界面逻辑，仅在配置了 API 渠道时显示 Cloud ASR 选项。
    - 验收: 后端建立统一转写控制器，通过环境变量配置 API Key，确保密钥安全。
    - 验收: 优化文章编辑器中的“语音润色”工作流，支持识别后自动调用 LLM 整理大纲。

### 3. UI 交互体验优化 (UI & UX Optimization) (P0) (已完成)
- [x] **文章详情页响应式布局优化 (Article Detail Responsive Layout)**
    - 校验: 修复文章宽度导致的横向滚动条问题。
    - 校验: 修复移动端工具栏和底边栏宽度及按钮定位问题。
    - 校验: 优化文章正文在不同屏幕尺寸下的动态响应能力。
    - 校验: 优化头图缩放逻辑，修复裁剪不当问题。
    - 校验: 实现头图点击查看大图功能。
- [x] **AI 图像驱动补全 (AI Image Drivers)**
    - [x] **任务核心引擎**: 基于 `AITask` 实体与 API 轮询的异步生成闭环已打通。
    - [x] 验收: 完成 **Gemini 3 Pro Image** 驱动，支持文本生成图片。
    - [x] 验收: 完成 **Stable Diffusion** (WebUI API) 驱动，支持调用本地或云端 SD 实例。

### 4. 极客阅读与系统交互 (Geek UX & Notifications) (P1) (已完成)
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

### 5. 全局架构固化与连接 (Architecture & Ecosystem) (P1/P2) (已完成)
- [x] **后端统一 i18n 机制 (Backend i18n Integration)**
    - 验收: 基于 Nitro 钩子实现请求级的语言识别。
    - 验收: 邮件模板、RSS 摘要及错误码反馈实现全自动关联翻译。
- [x] **MCP 生态生产验证 (MCP Validation)**
    - 验收: 完成 MCP Server 在多环境下的性能压力测试。
    - 验收: 完善 MCP 对 Cursor/Claude 等 AI 编辑器的交互定义文件。

---

## 第七阶段：系统固化与多媒体进阶 (System Hardening & Multimedia Evolution) (已完成)

### 1. 播客全链路与多媒体进阶 (Podcast & Multimedia Evolution)
- [x] **文本转播客 (Text-to-Podcast) (P1)**
    - [x] 播客音频合成与元数据注入
    - [x] 火山引擎（Volcengine）TTS 接口对接与优化
    - [x] 火山引擎（Volcengine）播客专用模型接入与评测
- [x] **实时语音识别 (Real-time ASR) (P1)**
    - [x] 流式 ASR 控制器扩展 (支持 WebSocket/Chunks)
    - [x] 实时转录前端交互界面与低延迟显示

### 2. 系统固化与安全校验 (System Hardening & Security)
- [x] **全站权限深度审计 (P1)**
    - [x] API 路由鉴权逻辑全面核查
    - [x] 前端页面/组件访问可见性逻辑加固
    - [x] 数据层面权限隔离验证 (多角色/多租户模拟)
- [x] **元数据统一化管理 (P1)**
    - [x] 系统级元数据统一存储模型设计
    - [x] 稳健的 Metadata 局部更新 (Patch) 逻辑实现
    - [x] 分散字段（大纲、音频属性等）全量迁移与统一接管
- [x] **接口安全增强和漏洞修复 (P1)**
    - [x] 增强 api 的 zod 验证覆盖，特别是边界条件和异常输入
    - [x] 完成漏洞修复，确保 Dependabot alerts 没有 High 级别的未修复项
- [x] **修复 ajv 漏洞 (ReDoS) (P1)**
    - [x] 在 package.json 中添加 pnpm.overrides 强制升级 ajv 到安全版本
    - [x] 验证 lockfile 更新
- [x] **Serverless ESM 依赖解析兼容修复 (P1)**
    - [x] 回滚 `html-minifier` / Nitro externals 临时 workaround，恢复稳定基线
    - [x] 定位 `mjml`/`lodash`/`htmlparser2` 在 Node ESM + Serverless 下的真实根因
    - [x] 设计并验证最终方案（依赖替代或构建策略），避免再次出现 `ERR_MODULE_NOT_FOUND`
- [x] **配置文档分层与场景化改造 (P2)**
    - [x] 将部署配置按“基础必填 / 功能模块 / 厂商专题”分层，减少单页信息过载
    - [x] 为 AI/ASR/TTS 增加“按提供商最小配置清单”与排障指引
    - [x] 建立环境变量与系统设置 (SettingKey) 的完整映射索引页

### 3. 感官体验增强 (Sensory Experience Enhancement)
- [x] **看板娘系统 (Live2D) (P2)**
    - [x] Live2D 运行时集成与模型加载优化
    - [x] 基础交互行为（点击、闲时、跟随）实现
- [x] **视觉增强特效 (P2)**
    - [x] 可选视觉优化（背景粒子、平滑过渡动画等）
    - [x] 性能平衡：在低端设备上自动降级/关闭特效

### 4. 性能基准与优化 (Performance & Optimization)
- [x] **Lighthouse 红线机制 (P2)**
    - [x] 文档基线：补充并维护 [性能规范](../standards/performance.md)，明确审计对象、采样策略和发布门禁
    - [x] 阈值策略：采用分阶段爬坡（Phase A 跑通基线 -> Phase B 守住基线 -> Phase C 四项 >= 90 阻断）
    - [x] CI/CD 流程中集成 Lighthouse CI 审计（核心页面、移动端+桌面端、每页 3 次取中位数）
    - [x] 核心采样页收敛：移除 `/login`、`/register`，避免非内容页噪声干扰门禁判断
    - [x] 配置核心页面性能红线（Performance/Accessibility/Best Practices/SEO 全部 >= 90）
    - [x] 配置关键指标红线（LCP <= 2.5s、CLS <= 0.1、TBT <= 200ms）并在失败时阻断发布
- [x] **极限加载优化 (P2)**
    - [x] 建立并执行 Bundle 预算（核心首屏 JS gzip <= 260KB、单异步 Chunk <= 120KB、关键 CSS <= 70KB）
    - [x] MVP：在 CI 中接入预算检查脚本并输出 `bundle-budget-report.json`（warn 模式）
    - [x] 建立 PR 增量预算（核心首屏 JS 单次增量 <= 20KB，超标需附收益说明）
        - [x] MVP：PR 流程下载 `master` 基线报告并执行增量对比（warn 模式）
    - [x] Bundle 体积精算与依赖项裁剪（优先清理高体积低频依赖）
        - [x] 首轮裁剪：`mavon-editor` 改为仅在管理端使用页动态加载，移除全局插件注册
        - [x] 首轮裁剪：`driver.js` 改为 Demo 引导触发时动态加载，移除全局 `driver.css`
    - [x] 关键路径渲染 (Critical Path) 深度调优（首屏阻塞资源最小化、非关键资源延迟加载）
        - [x] 首轮调优：`app.vue` 初始化从阻塞式改为非阻塞执行（先渲染，后拉主题与站点配置）

## 第八阶段：生态能力收敛与协议落地 (Ecosystem Convergence & Protocol Delivery) (已审计归档)

### 1. 系统配置深度解耦与统一化 (System Config Unification) (P1)
- [x] **配置加载层方案收敛**
    - [x] 确认并固化当前 `ENV` 优先、`DB` 补偿、`Default` 兜底的轻量三层读取模型
    - [x] 完成 `Better-Auth` 动态配置改造可行性收敛，确认短期维持 ENV 锁定与重启生效路径
- [x] **系统设置与审计增强（已完成部分）**
    - [x] 增加配置项变更审计日志，记录管理员对数据库配置的写入历史与变更原因
    - [x] 明确审计边界：当前不直接审计宿主环境变量变更，环境变量改动由部署平台或运维系统承担审计职责
- [-] **迁移至积压项（未在本阶段完成）**
    - [-] “智能混合模式”说明卡片、来源徽标与更细粒度锁定原因提示已迁移至 [长期规划与积压项](./backlog.md)

### 2. 商业化与广告联盟集成 (Commercial & Ad Networks) (P1)
- [x] **多平台广告系统接入**
    - [x] 实现 Google AdSense 自动广告与手动 Slot 注入逻辑，支持在文章中间或末尾动态展示
    - [x] 实现百度、腾讯等国产广告联盟的接入，支持按 Locale (zh-CN) 定向显隐
- [x] **商业与投放管理 (Ad/Link Management)**
    - [x] 实现站内商业内容管理，支持全局/按分类/按标签注入广告占位符
    - [x] 实现外链安全过滤与跳转页 (Redirect Gate)，提升商业点击的可追踪性
    - [x] 修复广告活动、广告位与外链管理页面的 PrimeVue 样式兼容问题，补齐 Vite 去重与弹窗表单布局

### 3. 开放发布协议支持 (Open Federation - Phase I) (P2)
- [x] **ActivityPub 基础骨架 (Foundation)**
    - [x] 实现 WebFinger 发现逻辑 (`/.well-known/webfinger`)
    - [x] 实现 ActivityPub Actor 路由 (`/fed/actor/:username`)
    - [x] 实现 ActivityPub Note 路由 (`/fed/note/:id`)
    - [x] 实现 Outbox 只读端点 (`/fed/outbox/:username`)
    - [x] 创建 RSA 密钥管理实体 (`server/entities/fed-key.ts`)
    - [x] 创建 HTTP 签名工具 (`server/utils/fed/crypto.ts`)
    - [x] 创建对象映射工具 (`server/utils/fed/mapper.ts`)
- [x] **Feed 协议兼容性**
    - [x] 验证 RSS 2.0 / Atom 1.0 / JSON Feed 1.1 输出正确性
    - [x] 确认可见性过滤正确 (只有 PUBLIC 文章)

### 4. ASR 性能与体验极限优化 (Extreme ASR Performance) (P1)
- [x] **Phase 1: 前端直连签名认证**
    - [x] 创建 ASR 类型定义 (`types/asr.ts`)
    - [x] 创建凭证生成工具 (`server/utils/ai/asr-credentials.ts`)
    - [x] 创建凭证颁发 API (`server/api/ai/asr/credentials.post.ts`)
    - [x] 创建前端直连 Composable (`composables/use-asr-direct.ts`)
- [x] **Phase 2: 音频压缩优化**
    - [x] 创建音频压缩工具 (`utils/audio-compression.ts`)
    - [x] 实现轻量级 PCM 重采样策略
- [x] **Phase 3: 异步任务支持**
    - [x] 扩展 ASR 服务异步任务方法 (`server/services/ai/asr.ts`)
    - [x] 创建异步转录 API 端点 (`server/api/ai/asr/transcribe/async.post.ts`)
    - [x] 创建任务追踪 Composable (`composables/use-asr-task.ts`)
    - [x] 修复 AIBaseService 支持可选 payload 和 progress
- [x] **Phase 4: 集成与测试**
    - [x] 集成直连模式到语音编辑器 (`composables/use-post-editor-voice.ts`)
    - [x] 编写 ASR 凭证工具单元测试 (`tests/server/utils/ai/asr-credentials.test.ts`)

### 5. Serverless 生态深度适配 (Serverless Ecosystem Integration) (P2)
- [x] **核心安全增强**
    - [x] 创建 Webhook 安全校验工具 (`server/utils/webhook-security.ts`)
    - [x] 重构 Webhook API 接口 (`server/api/tasks/run-scheduled.post.ts`)
- [x] **平台原生配置**
    - [x] 更新 Vercel Cron Jobs 配置 (`vercel.json`)
    - [x] 更新 Cloudflare Scheduled Events 配置 (`wrangler.toml`)
    - [x] 创建 Cloudflare 内部触发处理器 (`server/routes/_scheduled.ts`)
- [x] **配置与文档更新**
    - [x] 更新 Runtime Config (`nuxt.config.ts`)
    - [x] 更新环境变量文档 (`.env.example`, `.env.full.example`)
    - [x] 更新设计文档 (`docs/design/modules/scheduled-publication.md`)
- [x] **测试覆盖**
    - [x] 编写 Webhook 安全校验单元测试
    - [x] API 集成测试通过静态检查

### 6. ASR 前端直连鉴权增强 (Direct Speech Auth Hardening) (P1)
- [x] **火山引擎临时 JWT 鉴权切换**
    - [x] 将直连凭证从永久 Access Key 暴露改为服务端申请临时 JWT，并限制为短时有效
    - [x] 为前端直连会话生成临时 `uid`，避免复用站内永久身份标识
- [x] **WebSocket Query 鉴权改造**
    - [x] 将火山引擎直连模式改为通过 URL Query 传递鉴权参数，兼容浏览器 WebSocket 限制
    - [x] 对齐火山引擎大模型 ASR 直连端点与 Query 参数结构
- [x] **文档与测试闭环**
    - [x] 更新 ASR 设计文档中的前端直连方案说明
    - [x] 更新临时凭证单元测试，覆盖 JWT 鉴权与时长下限约束

### 7. ASR 配额能力清理 (ASR Quota Cleanup) (P1)
- [x] **移除未落地的 ASR 配额限制**
    - [x] 删除未被前端和后台消费的 ASR 配额实体与查询接口
    - [x] 移除 ASR 服务中的独立额度校验与累加逻辑，保留 `AITask` 用量追踪
    - [x] 更新初始化数据库脚本与设计文档，明确当前阶段不启用独立 ASR 额度治理

---

## 第九阶段：全球化治理与交付基础设施 (Globalization Governance & Delivery Infrastructure) (已审计归档)

**审计结论**: 第九阶段核心目标已在代码与文档中完成收敛；唯一未在本阶段正式交付的项为“存量资源链接重写与迁移工具”，已转入第十阶段继续推进。

### 1. 系统配置体验补强 (System Config UX Enhancements) (P1)

> 当前执行策略: 已完成解释层 API / UI 契约收敛，并已进入首轮实现。当前已落地增强元信息、页级概览卡片、字段级来源徽标与 tooltip 提示；下一步重点是继续压缩表单密度、补齐关键交互测试并完成剩余文档同步。

- [x] **智能混合模式可解释性增强**
    - [x] 在后台设置页增加“智能混合模式”说明卡片，明确 `ENV -> DB -> Default` 的优先级与生效路径
    - [x] 为设置接口补充 `envKey`、`defaultUsed`、`lockReason` 等元信息，并完成前端消费
    - [x] 为锁定项补充来源徽标与更细粒度提示，形成完整的只读解释闭环
- [x] **测试与文档同步**
    - [x] 补充设置服务、设置接口与设置页交互测试，覆盖来源解释与锁定提示场景
    - [x] 更新系统配置设计文档，确保 UI 解释层与实现一致

### 2. AI 成本治理与多用户配额 (AI Cost Governance & Multi-user Quotas) (P1)

> 当前执行策略: 先基于现有 `AITask`、后台 AI 统计页与已接入的文本/图像/ASR/TTS 能力，收敛统一审计模型、额度单位和失败扣额口径。首轮优先完成专项设计文档与后台视图契约，再进入实体字段、接口聚合和测试补强实现。

- [x] **统一用量审计模型**
    - [x] 基于 `AITask` 收敛 AI/ASR/TTS 的用量聚合口径，明确成本、时长、调用次数与失败率的统计模型
    - [x] 设计后台审计视图所需的数据结构与查询接口，避免未来重复建模
- [x] **分级额度治理**
    - [x] 建立按角色、用户组或信任等级的配额策略，优先覆盖低信任用户与高成本能力
    - [x] 明确管理员、作者与普通用户的默认策略与豁免边界
- [x] **告警与测试闭环**
    - [x] 提供阈值告警方案与最小可行实现，支持按日或按月维度发现异常消耗
    - [x] 补齐用量统计、额度判定与告警逻辑测试

### 3. 国际化语言扩展与配置模块化 (I18n Expansion & Modularization) (P1)

> 当前执行策略: 本轮不将“国际化语言扩展与配置模块化”和“多语言 SEO 深度优化”拆成两份孤立方案，而是以 Locale Registry 为统一事实源进行一体化设计。设计重点是先收敛默认语言、回退链、Locale 元数据、翻译模块拆分与语言准入规则，再让页面 Head、结构化数据和站点地图共享同一套语言配置。当前已继续补齐公开页 SEO 相关词条，文章列表、分类列表、标签列表、归档、关于、投稿、用户协议与隐私政策页已接入统一 `usePageSeo` 链路；同时已将翻译模块进一步细分为 `public / auth / admin / settings / home / demo / installation / legal`，并通过全局路由中间件按当前路径与 demo 模式渐进加载额外模块，默认首屏仅保留核心词条。下一步继续推进冗余词条清理与旧结构迁移收口。专项设计见 [国际化扩展与多语言 SEO 统一设计](../design/governance/i18n-seo-unification.md)。

- [x] **多语言配置中心化**
    - [x] 将当前双语言能力抽象为可配置 Locale 集合，支持默认语言、回退策略与 Locale 元数据集中管理
    - [x] 建立新增语言的最小准入清单与启用规则，避免出现半完成语种
- [x] **翻译文件模块化拆分**
    - [x] 将翻译文件按 `common`、`auth`、`admin`、`post` 等模块拆分，降低维护成本
    - [x] 支持按需加载或渐进式加载，控制首屏负担
    - [x] 排查未配置字段和未使用字段，清理冗余翻译
- [x] **测试与迁移保障**
    - [x] 设计旧翻译结构到新模块结构的迁移方案，避免现有词条丢失
    - [x] 补充 i18n 配置、加载与回退策略测试

### 4. 多语言 SEO 深度优化 (Multilingual SEO) (P1)

> 当前执行策略: 已完成首轮基础设施落地，并复用 Locale Registry 收敛共享页面 SEO 契约。当前已补齐共享 absolute URL / SEO 图片 / JSON-LD 构建器，首页已切到统一 `usePageSeo` 链路，动态 sitemap 已支持语言变体 alternates；本轮又继续把文章列表、分类列表、标签列表、归档、关于、投稿、用户协议与隐私政策页切到统一 SEO 管线，并将上述静态公开页纳入多语言 sitemap alternates 覆盖，相关定向测试与本轮 `typecheck` 已通过；下一步继续补齐更高层级的自动化回归校验。专项设计见 [国际化扩展与多语言 SEO 统一设计](../design/governance/i18n-seo-unification.md)。

- [x] **多语言元标签增强**
    - [x] 自动生成并校验 `hreflang`、canonical、Open Graph、Twitter Card 的多语言版本
    - [x] 明确 SSR 输出策略，确保搜索引擎抓取结果稳定
- [x] **结构化数据与站点地图深化**
    - [x] 为多语言页面补齐 JSON-LD 等结构化数据输出
    - [x] 扩展站点地图，确保语言变体在 Google、Bing、Baidu 等搜索引擎中可稳定索引
- [x] **回归验证**
    - [x] 建立多语言 SEO 关键页面的自动化校验方案，覆盖首页、文章页、分类页等核心场景

### 5. 云端存储与静态资源优化 (Cloud Storage & Static Assets Optimization) (P1)

> 当前执行策略: 已完成统一直传授权、存储类型规范化、通用上传 Composable 与编辑器接入，并落地了 BaseURL/Prefix 地址治理配置。当前正在开发“存量链接重写与迁移工具”；同时已确认业务默认路径策略将继续按归属实体收敛，头像维持 `avatars/{user.id}/`，文章资源统一归档到 `posts/{post.id}/{image|audio|video|file}/`，文章相关 AI 图片与 TTS 音频不再额外拆分来源型顶级目录；后续将补齐对象存储 Profile 扩展与部署文档同步。

- [x] **前端直传 OSS 能力**
    - [x] 建立后端签名、前端直传的图片/音频/视频上传链路，减少服务端中转压力
    - [x] 兼容主流对象存储接口（如 S3 兼容协议），并明确权限与时效边界
- [x] **静态资源统一管理**
    - [x] 收敛 CDN 前缀、资源路径与公共访问地址的配置方式
    - [-] 支持对存量资源链接进行重写或迁移，降低存储后端切换成本
- [x] **业务默认路径策略收敛**
    - [x] 明确并统一 `avatars/{user.id}/` 与 `posts/{post.id}/{image|audio|video|file}/` 的目录约定
    - [x] 将文章相关 AI 图片、TTS 音频等直接写入文章目录，避免来源型顶级目录继续扩散
    - [x] 补齐对象键生成、直传授权与上传服务测试，覆盖新路径策略与兼容回退
- [x] **测试与迁移验证**
    - [x] 补充上传签名、资源访问、路径重写逻辑（初步）与 Composable 测试
    - [x] 更新存储模块设计文档与部署说明，明确直传与 CDN 配置路径

### 6. 安全热修复 (Security Hotfixes) (P0)
- [x] **Dependabot 传递依赖漏洞热修复**
    - [x] 通过 pnpm overrides 将 `immutable` 锁定到 `>= 5.1.5`
    - [x] 通过 pnpm overrides 将 `tar` 锁定到 `>= 7.5.10`
    - [x] 通过 pnpm overrides 将 `svgo` 锁定到 `>= 4.0.1`
    - [x] 更新 lockfile 并验证漏洞版本不再出现在依赖树中

### 7. 管理端代码治理热修复 (Admin Code Quality Hotfix) (P1)
- [x] **超长文件拆分以恢复 ESLint max-lines 合规**
    - [x] 拆分 `components/admin/settings/ai-settings.vue` 中的配额策略与告警阈值编辑区，避免单文件继续膨胀
    - [x] 抽离 `pages/admin/posts/[id].vue` 的派生展示逻辑或辅助逻辑，使页面重新满足 `max-lines` 限制
    - [x] 运行针对性 Lint / Typecheck，确认拆分后行为与现有编辑流程一致

### 8. 内容分发集成热修复 (Content Distribution Integration Hotfix) (P1)

> 当前执行策略: 已完成本轮热修复。已补齐文章发布后同步到 Memos 的真实落地逻辑，并补录遗漏的实现任务与测试闭环。

- [x] **Memos 发布同步逻辑补完**
    - [x] 在 `server/services/post-publish.ts` 中接入现有 Memos 工具，生成可读摘要与文章链接并发起创建请求
    - [x] 在同步成功后回写文章集成元数据，记录 `metadata.integration.memosId` 以便追踪
    - [x] 补齐定向测试，覆盖同步成功与异常兜底场景

### 9. 分发版权声明热修复 (Distribution Copyright Hotfix) (P1)

> 当前执行策略: 已完成本轮热修复。已为邮件、Memos、WechatSync 多渠道分发统一追加与文章页一致的版权尾注，并补齐定向测试。

- [x] **多渠道版权尾注统一**
    - [x] 抽取共享版权尾注工具，统一许可解析、作者/地址/声明格式与 text/markdown/html 输出
    - [x] 在营销邮件、Memos 同步与 WechatSync 导出正文末尾追加版权声明
    - [x] 同步更新文章页版权文案与定向测试，确保站内外声明一致

---

## 第十阶段：通知闭环与全球体验增强 (Notification Closure & Global Experience Enhancement) (已审计归档)

**审计结论**: 第十阶段围绕通知触达、工程治理、多语言增强与新用户体验的核心任务已全部闭环；原待办中唯一未勾选的“复用抽象与质量门禁”已依据其拆解子项全部完成而补记为完成。本阶段不再保留专属遗留项，跨阶段积压统一收敛到 [长期规划与积压项](./backlog.md)。

> **当前阶段**: Phase 10
> **核心目标**: 基于现有 SSE、Locale Registry、Demo / Onboarding 与质量门禁基础设施，补齐“通知触达 -> 语言扩展 -> 工程治理 -> 新用户体验”闭环。
> **ROI 评估**: 浏览器推送补强 1.67；代码质量与工程化 1.80；国际化与本地化增强 1.80；用户体验优化 1.60。四项均满足下一阶段准入条件。

### 1. 浏览器推送补强 (Browser Push Reinforcement) (P0)

- [x] **通知订阅与投递链路**
    - 验收: 基于现有 SSE 通知中心新增浏览器订阅注册、失效清理与权限状态感知。
    - 验收: 管理员站务通知与高价值异步任务完成事件可在在线场景走 SSE、离线场景走 Web Push，避免重复推送。
    - 验收: 补齐 VAPID、Service Worker、订阅持久化配置说明与最小测试闭环。
- [x] **通知场景收敛**
    - 验收: 首轮仅覆盖管理员站务通知、AI / ASR / TTS 等异步任务完成提醒，明确不纳入营销通知与低价值提醒。
    - 验收: 管理端可配置浏览器通知开关，并与现有邮件通知策略保持一致。
- [x] **通知历史与投递审计**
    - 验收: 用户可查看已接收过的通知列表，至少支持已读状态、时间、通知类型与跳转目标。
    - 验收: 管理员可查看通知发送审计列表，并按通知类型、发送渠道、发送结果和时间范围筛选投递记录。
    - 验收: SSE、Web Push、邮件等渠道复用统一通知事件与投递日志结构，避免“用户收到了但后台不可追踪”。
    - 当前拆解:
        - [x] 用户历史列表：在现有通知中心之外补齐历史通知查询接口、分页列表与已读状态回填。
        - [x] 管理员投递审计：为通知发送结果沉淀 `channel`、`status`、`recipient`、`sentAt` 等筛选字段，并提供后台列表页。
        - [x] 定向回归：补齐通知列表、投递日志与筛选条件的契约 / 交互测试。

### 2. 代码质量与工程化 (Code Quality & Engineering) (P0)

- [x] **核心路径类型治理**
    - 验收: 为通知、设置、编辑器、AI 相关核心模块建立 `any` 清单，按优先级完成首轮消减与类型收敛。
    - 验收: 新增或重构的接口边界统一使用共享 schema / type，避免继续扩散隐式对象结构。
    - 当前拆解:
        - [x] 基线盘点：围绕 `pages/admin/ai/index.vue`、`components/admin/ai/*`、`components/admin/settings/*.vue`、`components/admin/posts/post-editor-*`、`components/app-notifications.vue`、`composables/use-admin-list.ts`、`composables/use-app-fetch.ts` 建立首轮 `any` 清单，并按“请求边界 -> 列表页 -> 详情/弹窗 -> 设置页”排序处理。
        - [x] AI 管理域收口：补齐 `types/ai.ts` 周边的共享类型，新增任务列表项、任务详情、统计面板、成本展示等前后端共用 type，优先替换 `pages/admin/ai/index.vue` 与 `components/admin/ai/task-list.vue`、`stats-overview.vue`、`task-details-dialog.vue` 中的 `any`。
        - [x] 设置与主题收口：为 `components/admin/settings/ai-settings.vue`、`general-settings.vue`、`theme-config-section.vue`、`theme-preview-section.vue` 的 `settings` / `metadata` / theme key 建立明确类型，减少 `defineModel<any>`、`Record<string, any>` 和颜色 key 的隐式写法。
        - [x] 公共请求层收口：收紧 `useAdminList` 与 `useAppFetch` 的泛型、查询参数和返回结构，统一 `items` / `total` / `costDisplay` 等契约，避免 `options: any`、`filters: any`、`response: any` 继续向页面层扩散。
- [x] **AI 成本口径统一与货币展示**
    - 验收: TTS provider 预估接口命名与调用链统一，避免同类能力出现多套成本估算入口。
    - 验收: 基于系统设置提供 `AI_COST_FACTORS`，由管理员统一配置展示货币、符号、额度单价与汇率。
    - 验收: 后台 AI 统计、任务列表、任务详情和文章 TTS 弹窗统一消费同一套成本映射与货币展示配置，不再混用美元与人民币符号。
    - 当前拆解:
        - [x] 事实源统一：以 `server/utils/ai/cost-governance.ts`、`server/services/ai/cost-display.ts` 与 `AI_COST_FACTORS` 为唯一成本口径，梳理 provider 原始成本、quota 单价、汇率换算与展示货币的责任边界。
        - [x] TTS 预估命名收口：梳理 `TTSService.estimateProviderCost`、`TTSService.estimateCost`、`/api/ai/tts/estimate` 三层命名与返回结构，统一成“provider 原始估算 + display cost 展示值”的单一路径，避免后续再出现平行入口。
        - [x] 前端展示收口：为 AI 后台页和文章 TTS 弹窗新增共享 `AICostDisplay` 类型/格式化入口，统一替换 `components/admin/ai/*` 与 `components/admin/posts/post-tts-dialog.vue` 中各自维护的 `currencySymbol`、`currencyCode`、`formatMoney` 与默认币种回退逻辑。
        - [x] 定向回归：补齐 `/api/admin/ai/stats`、`/api/admin/ai/tasks`、`/api/ai/tts/estimate` 的契约测试，并补充 AI 后台页和 TTS 弹窗的定向回归，确保展示符号、汇率与金额精度一致。
- [x] **复用抽象与质量门禁**
    - 验收: 抽离至少一组高重复的管理端列表、表单或服务逻辑为共享能力，并通过既有场景复用验证。
    - 验收: 收紧 ESLint、TypeScript、i18n audit 与定向测试门禁，确保新增代码默认纳入质量检查。
    - 当前拆解:
        - [x] 工具函数去重：优先抽离 AI 管理页中的状态 Tag severity、成本格式化、日期展示、JSON 序列化等重复函数，并检查 `utils/`、`server/utils/`、`composables/` 内完全相同或高度相似的 helper，统一归并到共享工具层。
        - [x] 样式复用：以 `components/admin/settings/theme-config-section.vue`、`theme-preview-section.vue`、`components/admin/posts/post-editor-settings.vue` 为首批样本，抽离可复用的 `form-group`、`color-input-group`、输入附加器和 AI 详情块样式，沉淀到共享 SCSS 片段或管理端公共样式层。
        - [x] 模板与组件复用：针对主题设置、AI 统计卡片、AI 详情指标块和管理端表单项提炼可复用的展示组件或 slot 模板，减少同类 `<label + 输入 + 锁定提示>`、`<标题 + 指标 + 图标>`、`<label + value>` 结构的重复。
        - [x] 页面拆分收口：抽离 `use-installation-wizard.ts`、`use-post-editor-page.ts`、`use-post-editor-translation.ts` 与 `use-admin-friend-links-page.ts`，将 `pages/installation.vue`、`pages/admin/posts/[id].vue`、`pages/admin/friend-links/index.vue` 收敛为装配层，清除本轮相关大文件告警。
        - [x] 大文件拆分：首轮优先拆分 `components/admin/posts/post-tts-dialog.vue`、`components/admin/settings/theme-config-section.vue`、`components/admin/posts/post-editor-settings.vue`、`pages/admin/ai/index.vue`，按“容器页 / 纯展示组件 / composable / 样式”分层，避免继续向 500+ 行增长。
        - [x] 质量门禁收紧：在首轮重构范围内同步补齐 lint、typecheck、i18n audit 与定向测试清单；新增代码默认要求无新增 `any`、有共享类型边界、并覆盖至少一条对应回归用例。
- [x] **日期时间与请求反馈治理**
    - 验收: 业务逻辑中的日期格式化、比较、排序、区间判断等优先统一使用 `dayjs`；直接 `new Date()` 仅保留在运行时边界、原生 API 入参或极简环境。
    - 验收: 请求成功 / 失败后的 toast、message、dialog 与表单反馈优先消费 i18n key、错误码或稳定状态枚举，不再直接暴露硬编码字段名、后端原始 message 或未国际化文本。
    - 验收: 补齐日期工具与请求反馈链路的定向回归或 audit，防止新增原生 `Date` 业务逻辑和未国际化提示回流。
    - 当前拆解:
        - [x] 日期逻辑收口：盘点 `composables/`、`utils/`、管理端列表、通知链路中的日期格式化 / 比较逻辑，约定“模板 `useI18nDate`、逻辑 `dayjs`、边界 `new Date()`”三层边界，并沉淀共享 helper。
        - [x] 请求反馈文案收口：梳理 `useAppFetch`、后台表单、批量操作、异步任务提示与通知确认链路，建立错误码 / 状态枚举到 i18n key 的映射；已完成 AI、友链、外链、广告、分类、标签、投稿、文章、系统设置、主题设置与用户管理页的后台提示收口，移除直接拼接字段名、英文 message 和服务端原文的主要入口。
        - [x] 门禁补强：为首轮治理范围补充 lint / i18n audit / 定向测试，至少覆盖一条成功提示、一条错误提示，以及一条 `dayjs` 替换后的日期比较或格式化回归用例。

### 3. 国际化与本地化增强 (I18n & L10n Enhancements) (P1)

- [x] **体验与本地化缺陷修复**
    - 验收: 首页、文章列表等文章卡片改为链接语义导航，不再仅依赖按钮或整卡点击跳转。
    - 验收: 沉浸式阅读开启后自动隐藏 Live2D 挂件，避免打断阅读。
    - 验收: 登录页首次进入时确保认证文案模块已预加载，`pages.login.submit` 等按钮文案不再缺失。
- [x] **新增繁体中文与韩语支持**
    - 验收: Locale Registry、新语言词条、语言切换入口与回退策略完成接入。
    - 验收: 首轮至少覆盖公共页面、认证、核心设置与 Demo / Onboarding 关键链路。
    - 验收: 文档站补齐繁体中文与韩语首页、快速开始与翻译治理页面。
    - 当前拆解:
        - [x] 设计方案：明确 `zh-TW` / `ko-KR` 的 readiness、路由前缀、回退链与 SEO 发布边界。
        - [x] 基础接入：扩展 Locale Registry、PrimeVue locale 与语言切换入口。
        - [x] 词条补齐：完成 `common / components / public / settings / legal / auth / home / demo / admin / email` 首轮翻译补齐。
        - [x] 文档站接入：补齐 `zh-TW` / `ko-KR` 首页、快速开始与翻译治理页面。
        - [x] 质量校验：补齐 locale registry、模块加载、登录页与 Onboarding 的定向测试，并执行 i18n audit。
- [x] **翻译治理与贡献流程**
    - 验收: 建立新增语言准入 checklist、术语约束与翻译贡献指南。
    - 验收: 补齐 i18n audit、SEO、邮件文本的定向回归校验，避免出现“UI 已翻译、系统链路未跟上”的半完成语种。
    - 当前拆解:
        - [x] 准入策略：新增语言默认以 `ui-ready` 接入，待邮件与 SEO 回归齐备后再升级到 `seo-ready`。
        - [x] 治理清单：沉淀模块 parity、PrimeVue、邮件 locale、SEO 与 sitemap 五类发布门禁。
        - [x] 贡献指南：补充新增语言的术语约束、翻译流程与回归命令说明。
        - [x] 发布回归：补齐 i18n audit、SEO 与邮件链路的定向回归记录。
- [x] **多语言文章回退与分类标签管理修复**
    - 验收: 文章列表在 `zh-TW` / `ko-KR` 缺少对应译文时，按 locale fallback 链仅展示一个回退版本，不再同时出现英文与简体中文的同源文章。
    - 验收: 分类页、标签页返回的 `postCount` 改为基于翻译组去重后的文章数量，公开页不再长期显示 `0`。
    - 验收: 分类管理页、标签管理页补齐分页数选择器，保持与文章管理页一致的后台列表体验。
    - 验收: 文章编辑器的标签输入区新增“清空所有标签”按钮，并要求二次确认，便于翻译文章重新打标签。
    - 当前拆解:
        - [x] 公开文章列表：基于 locale registry fallback chain 收敛同一 `translationId` 的候选版本，只保留首个可用语言。
        - [x] 分类 / 标签计数：改为按 `COALESCE(translationId, id)` 去重统计，并回填到 API 返回实体。
        - [x] 后台交互增强：为分类管理页、标签管理页补齐 `rowsPerPageOptions`，为文章设置抽屉补齐标签清空确认流程。
        - [x] 定向回归：补充 `/api/posts`、`/api/categories`、`/api/tags` 与翻译工具的回归用例并通过定向测试。
- [x] **全文翻译工作流重构** (P0)
    - 验收: 全文翻译支持显式选择来源文章 / 来源语言与目标语言，且来源文章必须限制在同一翻译簇内；目标语言已存在版本时，覆盖草稿确认一次、覆盖已发布版本确认两次，不再只允许对缺失语言执行一次性翻译。
    - 验收: 翻译支持范围选择，至少覆盖标题、正文、摘要、分类、标签，并允许基于同一翻译簇保存中间态草稿、继续翻译、重新全文翻译或重跑局部字段。
    - 验收: 翻译执行前应按所选范围清空目标字段的旧值；标签重译不得残留旧标签，封面与播客音频等媒体字段支持显式选择是否同步，其中封面默认同步、音频默认不同步。
    - 验收: 长文本翻译在编辑器中返回可见进度，优先复用现有 AITask 能力，并评估接入 SSE / 流式返回，避免只有完成态轮询。
    - 当前拆解:
        - [x] 来源 / 目标选择：重构文章编辑器翻译入口，支持在同一翻译簇内指定来源文章或来源版本、目标语言与目标版本状态展示，并在草稿 / 已发布版本上区分“新建翻译”“继续翻译”“覆盖翻译”。
        - [x] 覆盖确认治理：将覆盖确认分为草稿一次确认、已发布版本二次确认，并在文案、按钮危险级别与交互流程上明确区分。
        - [x] 字段级翻译：为标题、正文、摘要、分类、标签建立可组合的翻译范围选择与应用策略，避免每次强制全量覆盖。
        - [x] 字段覆盖清理：翻译前按字段范围显式清空目标语言版本的旧标签与其他可重建字段，确保重跑翻译时不残留旧值。
        - [x] 媒体同步策略：为封面、播客音频等附件建立可选同步策略，默认封面跟随翻译版本同步、音频默认不同步，并允许用户覆盖默认值。
        - [x] 草稿中间态：打通翻译中间态保存、继续翻译与重新全文翻译流程，确保目标语言已有草稿时可以恢复而不是被“不可翻译”阻断。
        - [x] 进度回传：将 `AITask.progress`、长文本分块进度与 `translate.stream` 能力正式暴露到编辑器 UI，补齐成功 / 失败 / 取消的反馈闭环。
        - [x] 定向回归：补齐 `/api/ai/translate`、`/api/ai/translate.stream`、文章编辑器翻译面板与自动保存恢复的契约 / 交互测试。
- [x] **分类 / 标签翻译关联治理** (P1)
    - 验收: 分类和标签的翻译关联不再主要依赖名称碰撞，创建与编辑流程应优先使用显式 `translationId`，并在为空时自动回填现有 slug 作为“别名 / 关联标识”，减少关联标识重复录入。
    - 验收: 文章翻译时的分类、标签映射改为基于翻译簇收敛，避免相同语义的多语言分类 / 标签因未关联而被重复创建或遗漏关联。
    - 验收: 分类自身名称继续按当前界面语言国际化展示；文章编辑器内展示的分类选项需优先显示“当前文章语言”对应的翻译，不存在时再按界面 locale fallback，而不是保存后回退成界面语言文本。
    - 验收: 创建分类 / 标签时，“同步创建对应的其他语言版本”复选框与“AI 自动翻译”按钮恢复正确对齐，并补齐冲突提示与定向回归。
    - 当前拆解:
        - [x] 关联标识兜底：为文章、分类、标签的 `translationId` 建立统一兜底策略，当关联标识为空时自动使用现有 slug 作为别名与翻译簇标识，并在服务层保持一致。
        - [x] 关联策略收口：补齐分类 / 标签创建与编辑时的翻译簇校验、候选关联提示与手动修复路径，避免仅凭名称导致同义实体失联。
        - [x] 翻译映射治理：重构文章全文翻译时的分类 / 标签复制逻辑，优先查找目标语言的同簇实体，不存在时再进入新建或待确认分支。
        - [x] 分类显示语义收口：区分“界面语言展示”与“文章语言翻译实体”两套语义，修正分类翻译保存后回退为界面语言文本的问题。
        - [x] 后台表单修复：修正分类 / 标签多语言编辑弹窗内“同步创建对应的其他语言版本”与“AI 自动翻译”的布局、对齐和交互反馈。
        - [x] 定向回归：补齐 `server/services/category.ts`、`server/services/tag.ts`、`pages/admin/categories/index.vue`、`pages/admin/tags/index.vue` 的回归测试。
- [x] **文章翻译标签生成与关联补强** (P1)
    - 验收: 文章编辑器在“新建翻译 / 继续翻译 / 覆盖翻译”场景下，标签不再只靠名称回填；应保留源标签的翻译簇信息，并随保存请求一并提交。
    - 验收: 目标语言已存在同簇标签时直接复用；不存在时基于源标签生成目标语言标签，并在创建时写入同一 `translationId`，避免形成新的孤立标签。
    - 验收: 用户在编辑器中手动增删标签后，待保存的标签绑定信息能够同步收敛；已有目标语言标签继续按精确翻译簇优先，手动新增标签则保持独立创建。
    - 验收: 补齐文章 schema、标签服务与文章翻译链路的定向回归，覆盖“复用现有翻译标签”“自动创建目标语言标签并关联翻译簇”“手动改写后回退到普通标签创建”三类场景。
    - 当前拆解:
        - [x] 方案文档：在分类 / 标签设计文档中补充“文章翻译标签绑定”策略、保存契约与冲突边界。
        - [x] 保存契约：为 `/api/posts` 的创建 / 更新请求新增标签翻译绑定字段，服务层优先按翻译簇查找或创建目标语言标签。
        - [x] 编辑器链路：在 `use-post-editor-page.ts` 与 `use-post-editor-translation.ts` 中保留并同步标签绑定信息，避免 UI 仅剩字符串数组时丢失源标签上下文。
        - [x] 定向测试：补齐 schema、服务层与翻译工作流的回归用例，并纳入本轮定向验证清单。

### 4. 反馈与互动增强 (Feedback & Interaction Enhancement) (P1)

- [x] **友链系统 (Friend Links System) (P0)**
    - [x] 验收: 实现 `friend-links` 独立页面，支持按“友链分类”展示及自定义排序。
    - [x] 验收: 实现前端自助申请表单，支持 Logo、名称、描述录入，并具备基础防骚扰规则（若已启用验证码，则接入验证码渠道）。应当可以设置准入条件说明（如：仅限相关领域、需提供交换友链的站点信息等），并在申请列表中展示申请来源 IP 和时间戳，便于管理员审核。
    - [x] 验收: 管理后台提供友链审核、置顶、排序与分类管理功能。
    - [x] 验收: 底栏 (`app-footer.vue`) 支持精选友链展示。
    - [x] 验收: 实现定时任务调度器（基于现有 `task-scheduler.ts`），定期检测友链可访问性并标记失效状态。
    - 当前拆解:
        - [x] 设计文档落地：新增 `docs/design/modules/friend-links.md`，明确实体、接口、页面与巡检策略。
        - [x] 首轮数据层：补齐友链分类、正式友链、申请记录实体与共享 schema。
        - [x] 公开侧：落地 `friend-links` 页面、公开列表接口、申请接口与准入条件展示。
        - [x] 后台侧：落地友链管理、申请审核、分类与排序能力。
        - [x] 展示与运维：接入底栏精选友链与定时巡检逻辑。
- [x] **友链巡检节流优化**
    - 验收: 友链可用性巡检默认频率下调，并支持在配置层明确最小巡检间隔，避免高频定时接口触发。
    - 验收: 连续失败站点应进入退避 / 冷却周期，减少对同一失效站点的重复请求。
    - 当前拆解:
        - [x] 巡检频率收口：统一默认 cron、批量大小与超时阈值，并与部署文档中的建议值保持一致。
        - [x] 失败冷却：为健康巡检引入退避窗口或失败计数冷却策略。
        - [x] 文档与回归：同步更新巡检策略说明与调度回归用例。
- [x] **“开往”全站集成 (Travellings Integration) (P0)**
     [开往](https://www.travellings.cn/) 是一个专注于博客友链互换的平台，提供了丰富的博客资源和友链交换功能。通过与开往的集成，我们可以为用户提供更多优质博客资源，并简化友链交换流程。
    - 验收: 遵循官方 Logo 模式，在页眉 (`app-header.vue`)、底栏 (`app-footer.vue`) 及侧边栏提供展示入口（由管理员配置具体展示哪些位置）。
    - 验收: 区分内链与外链样式（如：外链增加 `i-lucide-external-link` 图标或特定颜色标识），防止用户误解。
- [x] **Demo 与 Onboarding 体验增强**
    - 验收: 丰富 Demo 预置内容、展示路径与首次访问引导，使核心能力可在 3 - 5 分钟内被体验到。
    - 验收: 优化 onboarding 触发条件、步骤节奏与多语言文案，降低打断感。
    - 当前拆解:
        - [x] 首轮 Demo 入口：升级 Banner，提供“示例文章 / 内容浏览 / 创作后台”三条快捷体验路径。
        - [x] 首轮引导收敛：按 public / login / editor 三段触发，并支持跨路由续接。
        - [x] 首轮预置内容：补齐覆盖公开阅读、AI 创作与多语言工作流的 Demo 文章。
        - [x] Demo 安全增强：补齐 `/api/admin/settings`、`/api/auth/admin` 与 `/api/user/api-keys` 等敏感读写拦截，并增加 Guard 回归测试。
- [x] **初始化引导首配清单重构**
    - 验收: 重新梳理安装向导与 onboarding 的职责边界，明确首启时哪些配置应被建议优先完成，哪些应延后到后台。
    - 验收: 初始化引导页给出“建议立即配置 / 可稍后配置”分组，至少覆盖站点基础信息、语言 / 时区、认证 / 管理员、SEO、对象存储 / AI / 通知等关键项。
    - 验收: Demo 与生产环境采用不同的首配建议清单，避免演示流程与真实部署流程相互干扰。
    - 当前拆解:
        - [x] 首配清单盘点：盘点 installation wizard、demo banner、onboarding 与 settings 页面现有字段，按“必须 / 推荐 / 可后置”重排。
        - [x] 触发时机收口：重新定义首次进入安装向导、首次进入后台与首次进入编辑器时的提示节奏。
        - [x] 文案与回归：补齐安装向导 / onboarding 的多语言文案与定向回归。

- [x] **文章管理页媒体预览增强**
    - 验收: 文章管理页补齐封面预览入口，并在列表中直观显示封面是否存在。
    - 验收: 播客列恢复有效内容展示，支持对文章音频进行直接预览或快捷播放，不再只显示空白状态。
    - 验收: 列表页媒体预览与编辑器 / 详情页的封面、音频元数据保持一致，避免状态不一致。
    - 验收：聚合模式下，优先展示当前界面语言版本的封面与播客信息，避免同一文章出现多个语言版本时媒体信息混乱。没有时再按 locale fallback chain 展示其他语言版本的媒体信息。
    - 当前拆解:
        - [x] 封面预览：在文章管理列表加入封面缩略图或预览触发器。
        - [x] 播客快速预览：为播客列补齐音频状态、播放器或外链预览入口。
        - [x] 定向回归：补齐文章管理页媒体列渲染与预览交互测试。
- [x] **反馈入口与闭环**
    - 验收: 提供轻量反馈入口，仅提供反馈地址设置和联系方式录入，默认可复用网站联系邮箱，避免复杂的反馈系统设计与维护。
    - 验收: 应当区分墨梅博客项目本身的问题和第三方自部署站点的使用问题，前者引导用户提交到 GitHub Issues，后者引导用户联系站点管理员。
    - 验收: 反馈入口应在公开侧和管理端均有体现，并且在用户遇到问题时能够方便地找到。

---

## 第十一阶段：迁移治理与自动化交付深化 (Phase 11) (已审计归档)

**审计结论**: 第十一阶段围绕版本追踪、迁移治理、协议合规、第三方分发与 CLI / MCP 自动化的核心能力已全部在代码、管理端与工具面闭环；原待办中未勾选的“第三方分发解耦与投递控制”已由统一分发状态模型、手动同步入口、审计时间线与定向测试完成落地。本阶段不再保留专属遗留项，后续事项统一回收到 [长期规划与积压项](./backlog.md)。

> **当前阶段**: Phase 11
> **核心目标**: 围绕迁移可控性、版本可追溯性、协议治理、第三方分发解耦与 CLI / MCP 自动化扩展，补齐系统从“站内能力完整”走向“跨工具协作、可迁移、可追溯、可合规治理”的交付闭环。
> **ROI 评估**: 线性版本追踪与回滚 1.67；迁移链接治理与云端资源重写 1.80；第三方分发解耦与投递控制 1.60；CLI / MCP 自动化能力扩展 1.67；协议版本治理与合规展示 1.80。五项均满足下一阶段准入条件。

### 1. 线性版本追踪与内容回滚 (P0)

- [x] **Git Commit 化版本模型设计与数据落盘方案**
    - 验收: 明确文章版本记录采用单主线、线性提交模型，不引入分支管理、Cherry-pick 或多头合并语义。
    - 验收: 明确提交摘要、操作人、时间戳、关联文章、版本来源、恢复来源等核心字段及存储位置。
    - 验收: 若涉及数据库实体、版本仓储或文件存储方案变更，先补齐设计文档再进入开发。
- [x] **版本历史列表与差异查看接口/UI**
    - 验收: 管理端可查看文章版本历史列表，至少展示提交摘要、作者、时间、版本来源。
    - 验收: 支持相邻版本与指定版本之间的文本差异查看，差异展示口径在服务端与前端保持一致。
    - 验收: 需明确文章正文、标题、摘要、元数据字段哪些进入 diff，哪些仅做快照展示。
- [x] **回滚、恢复与幂等保护**
    - 验收: 支持从历史版本恢复为当前版本，并自动生成新的线性版本记录，而非覆盖旧记录。
    - 验收: 明确“回滚”“恢复”“撤销失败恢复”三类操作的权限、审计日志与失败提示。
    - 验收: 对已删除字段、翻译簇、媒体元数据等回滚副作用给出边界约束。
- [x] **测试与验证计划**
    - 验收: 补齐版本服务层单元测试、版本 API 集成测试、管理端历史/回滚交互测试。
    - 验收: 至少覆盖连续编辑、多次回滚、并发保存、无历史版本、权限不足 5 类场景。

### 2. 迁移链接治理与云端资源重写 (P0)

> 当前执行策略: 已完成“范围与契约冻结”“旧链接映射与承接机制”“资源重写与校验报告”“测试与验证计划”。专项设计见 [迁移链接治理与云端资源重写](../design/governance/migration-link-governance.md)。当前已补齐服务/API/CLI/后台入口的定向验证，并为治理报告新增后台查看入口。

- [x] **迁移链接治理范围与契约冻结**
    - 验收: 明确治理范围覆盖资源 URL、文章内链、分类/标签/归档链接、独立页面及历史 permalink 规则。
    - 验收: 明确 CLI、Open API、站内服务三层职责边界，避免同一条链接被重复治理或口径冲突。
    - 验收: 输出“dry-run / apply / report”最小能力矩阵，并确认输入输出数据结构。
- [x] **旧链接映射与承接机制**
    - 验收: 建立“旧 URL -> 新 URL”映射模型，支持文章、分类、标签、页面等多类型映射。
    - 验收: 明确 redirect seeds、alias 数据承接或站内查找回退方案，避免迁移后正文残留失效地址。
    - 验收: 支持按域名、路径规则、内容类型进行分组治理与审计。
- [x] **资源重写与校验报告**
    - 验收: 支持存量资源链接的批量重写、域名过滤、dry-run 预览与差异报告导出。
    - 验收: 支持站内静态校验，并预留可选在线外链检测，不把在线检测作为唯一成功判定条件。
    - 验收: 明确失败项重试、跳过、人工确认的处理策略。
- [x] **测试与验证计划**
    - 验收: 补齐映射解析单元测试、迁移报告集成测试、典型旧站样本回归测试。
    - 验收: 至少覆盖资源 URL、文章内链、相对路径、不可访问外链、重复映射冲突 5 类样例。

### 3. 协议版本治理与合规展示 (P1)

- [x] **协议生效语义闭环设计**
    - 验收: 明确“主语言”“权威版本”“当前生效版本”“参考译本”的独立语义，不再混用单一字段承载多个概念。
    - 验收: 后台激活动作、设置表记录与公开接口读取必须使用同一套生效判定口径。
    - 验收: 梳理环境变量协议、数据库协议与用户已同意协议之间的优先级和冲突处理规则。
- [x] **多语言协议版本管理与后台约束**
    - 验收: 管理端支持查看最近版本、历史版本、版本说明、生效日期、最近更新日期与翻译版本关系。
    - 验收: 已生效、已被用户同意、来自环境变量的协议版本在编辑/删除/替换时具有明确限制和提示。
    - 验收: 若协议模型、设置键或公开 API 发生变化，先同步更新设计文档与接口说明。
- [x] **公开协议页展示补完**
    - 验收: 用户协议与隐私政策页面展示真实版本号、生效日期、最近更新日期及必要的历史入口。
    - 验收: 对仅供参考的翻译版本给出明确提示，避免与具有法律效力的权威版本混淆。
    - 验收: 页面展示与登录/注册时的协议确认口径保持一致。
- [x] **测试与验证计划**
    - 验收: 补齐协议服务单元测试、协议管理 API 集成测试、后台设置页与公开协议页交互测试。
    - 验收: 至少覆盖生效切换、参考译本回退、用户已同意版本保护、环境变量锁定 4 类核心场景。

### 4. 第三方分发解耦与投递控制 (P1)

> 当前执行策略: 先以文章 `metadata.integration.distribution` 建立统一分发状态层与时间线审计，不新增独立数据表；Memos 由服务端接管首次同步、更新原内容、重推新内容与失败重试，WechatSync 保持浏览器插件执行但补齐服务端状态登记、人工终止与结果回写。后台统一收敛到文章编辑页分发面板，并在文章列表提供显式入口跳转；专项设计见 [第三方分发解耦与投递控制](../design/governance/content-distribution-governance.md)。

- [x] **分发状态模型与操作边界梳理**
    - 验收: 明确首次同步、重新推送、更新原内容、失败重试、人工终止等状态机与转换条件。
    - 验收: 将发布行为与第三方分发行为解耦，避免“发布即同步”成为不可中断副作用。
    - 验收: 明确 Memos 与 Wechatsync 的共同抽象层与差异化能力边界。
- [x] **管理端手动同步与重试入口**
    - 验收: 在文章列表或编辑页提供显式的手动同步、重试、状态查看入口。
    - 验收: 对已同步内容，手动同步时必须让用户在“更新原内容”与“重推新内容”之间二选一。
    - 验收: 对重复提交、并发点击、远端返回不一致等情况具备幂等保护。
- [x] **投递审计与失败可观测性**
    - 验收: 为第三方分发补齐时间线、错误日志、最后一次结果、重试记录等审计信息。
    - 验收: 失败原因至少区分鉴权失败、远端限流、网络异常、内容校验失败、远端不存在 5 类。
    - 验收: 明确后台提示文案与后续处理建议，避免仅暴露原始错误信息。
- [x] **测试与验证计划**
    - 验收: 补齐分发服务单元测试、投递 API 集成测试、管理端状态流转测试。
    - 验收: 至少覆盖首次同步成功、更新原内容、重推新内容、失败重试、重复点击幂等 5 类场景。

### 5. CLI / MCP 自动化能力扩展 (P1)

> 当前执行策略: 已完成统一外部自动化契约设计，并落地 API Key 驱动的外部 AI 自动化接口、CLI 命令面、MCP 工具面、配套设计文档、预览确认流、分类建议能力与定向测试闭环。当前可使用标题建议、标签推荐、分类推荐、整篇翻译、封面图生成、音频生成、任务查询与发布编排；专项设计见 [CLI / MCP 自动化能力扩展](../design/governance/cli-mcp-automation.md)。

- [x] **自动化能力分层与命令面设计**
    - 验收: 将 CLI 与 MCP 能力按“内容生成 / 翻译 / 媒体回填 / 发布编排 / 审计”进行能力分层，避免一轮迭代内命令面失控。
    - 验收: 明确 CLI 与 MCP 在交互模式、确认机制、长任务进度回传与失败恢复上的差异。
    - 验收: 冻结首轮能力范围，确保与当前站内 AI 能力一致，不凭空扩展新模型依赖。
- [x] **全文翻译与翻译簇回填**
    - 验收: 支持源语言检测或显式指定源语言，批量生成目标语言版本并沿用站内翻译簇语义。
    - 验收: 明确正文、标题、摘要、分类、标签、slug 的翻译范围与覆盖确认规则。
    - 验收: 支持任务进度、失败明细与人工确认回退，不将批量翻译设计成黑盒一次性操作。
- [x] **媒体生成、分类标签生成与文章回填**
    - 验收: 支持封面图、TTS / 播客音频生成后自动回填文章字段，并保留任务记录与覆盖确认。
    - 验收: 支持基于正文或摘要生成分类/标签及多语言翻译建议，并与现有 taxonomy / translationId 口径保持一致。
    - 验收: 明确批量 SEO 摘要、标题、slug、定时发布编排等自动化能力的最小可交付范围。
- [x] **测试与验证计划**
    - 验收: 补齐 CLI 命令层测试、MCP 工具契约测试、关键长任务回填流程集成测试。
    - 验收: 至少覆盖翻译回填、媒体回填、taxonomy 建议、人工确认取消、长任务失败恢复 5 类场景。

---

## 第十二阶段：内容编排与创作输入体验收敛 (已审计归档)

> 审计结论: 第十二阶段核心能力已在代码、测试与配置链路中完成闭环；本轮同步已补齐 roadmap、README、功能特性与分发设计文档中的实现漂移。下一阶段规划已转入 roadmap，不直接写入 todo。

### 1. 内容编排与创作输入体验收敛

- [x] **首页内容编排与文章置顶机制 (P0)**
    - 验收: 首页建立“最新文章 + 热门文章”双区块，并补齐跨区块去重与回填策略，避免同一篇文章重复占位。
    - 验收: 为文章模型、后台管理入口与公开查询补齐置顶字段及排序规则，明确置顶、热门、最新三者的优先级。
    - 验收: 为首页、文章列表、归档与管理端排序补齐单元测试或集成测试，确保 SSR 与 SEO 输出不回退。
- [x] **通用文本域语音输入能力 (P1)**
    - 验收: 基于现有文章编辑器语音录入链路抽象通用 composable 或组件，统一触发、插入、暂停、错误处理与模式切换行为。
    - 验收: 首批接入灵感采集、Snippet 快速捕捉和 Snippet 编辑弹窗等多行输入场景，不再复制页面级实现。
    - 验收: 补齐权限提示、可访问性文案与核心测试，覆盖 Web Speech 与云端 ASR 两类模式的基本回归。
- [x] **编辑器兼容性收敛与渐进替换预案 (P1)**
    - 验收: 输出当前编辑器在 Nuxt 4 / Vue 3 环境中的兼容性根因结论，并明确“继续修复现有接入”或“进入灰度替换验证”的决策依据。
    - 验收: 建立覆盖工具栏、双栏预览、全屏、图片上传回填、快捷插入和暗色模式的功能矩阵与回归清单。
    - 验收: 在未满足功能矩阵前，不直接整体替换编辑器；若进入替换验证，必须具备无功能回退的灰度或回退方案。
- [x] **多语言创作与第三方分发链路热修复 (Hotfix)**
    - 验收: 修复 `pages.admin.ai.types.translate_name_batch` 缺失翻译字段，避免后台 AI 翻译能力出现裸 key 或空白文案。
    - 验收: 修复 Memos 回写的远端链接口径，统一使用真实可访问的公开 permalink，而不是错误的内部路径或 API 路径。
    - 验收: 修复 WechatSync 插件同步失败链路，补齐失败分类、提示与最小回归验证，确保手动分发能力恢复可用。
    - 验收: 修复设置页 `default_language` 的 `languageOptions` 未与当前 Locale Registry 同步的问题，避免后台默认语言选项遗漏已支持语言。
- [x] **运行时传递依赖安全热修复 (Hotfix)**
    - 验收: 通过 `pnpm.overrides` 将 `undici`、`devalue`、`unhead`、`file-type` 与 `yauzl` 收敛到官方修复版本或更高安全补丁版本。
    - 验收: 同步刷新 `pnpm-lock.yaml`，确保锁文件中不再解析到告警中的脆弱版本。
    - 验收: 完成依赖安装并通过基础质量门禁校验，至少确认 `pnpm lint` 无阻塞错误、`pnpm typecheck` 通过。
- [x] **页脚品牌与版权配置解耦 (P1)**
    - 验收: 将页脚版权信息改为消费站点配置，明确站点名称、版权所有者、版权年份策略和 Powered by 文案的职责边界。
    - 验收: 若新增独立设置键或公开设置字段，需同步补齐安装向导、后台设置、公开设置接口与前端消费链路。
    - 验收: 补齐页脚组件与公开设置相关测试，避免继续复用文章版权协议字段作为页脚版权文案。

---

## 第十三阶段：多语言创作资产与渠道分发深化 (已审计归档)

> 审计结论: 第十三阶段核心交付与两项 Hotfix 已在代码、测试与文档中完成闭环；原待办中唯一未交付的“相关文章推荐”已按可选增强重新评估后移入 [长期规划与积压项](./backlog.md)，不再作为本阶段阻塞项。

### 1. 多语言封面与音频资产一致性 (P0)

- [x] **多语言封面生成与回填口径统一**
    - 进展: 已完成目标语言 prompt 透传、封面 locale 绑定元数据、编辑器内“先选图再回填”确认链路，以及翻译流程默认禁复用源语言封面。
    - 验收: 翻译文章生成封面时，支持以目标语言标题、摘要或显式提示词作为输入，不再默认复用源语言封面。
    - 验收: 明确封面回填优先级、覆盖确认规则与失败回退策略，避免不同语言版本共享错误封面。
    - 验收: 补齐封面生成与文章回填的定向测试，至少覆盖源语言复用禁用、目标语言输入生效、缺失封面回退 3 类场景。
- [x] **多语言 TTS / Podcast 资产绑定**
    - 进展: 已完成音频 locale / translationId / postId 绑定写回，明确已有目标语言音频的保留 / 重生成 / 解绑规则，并禁止翻译流程默认复制源语言音频。
    - 验收: 支持按 locale 生成独立 TTS / Podcast 音频资产，并明确与 `translationId`、文章语言、文章字段的绑定关系。
    - 验收: 明确已有音频覆盖、保留、重生成与解绑规则，避免跨语言文章误用同一音频资源。
    - 验收: 补齐音频生成、字段回填与展示回退测试，至少覆盖独立生成、重复生成、缺失音频回退 3 类场景。

### 2. 渠道分发内容模板与标签适配 (P0)

> 进展: 已完成现状调研，确认当前 Memos 模板在服务端生成、WechatSync 模板在前端生成，且 WechatSync 插件因“单份 post + 多账户”入参限制，必须通过账户分组来承载差异化标签格式。执行方案见 [渠道分发模板与标签适配方案](../design/governance/content-distribution-template-tag-adaptation.md)。

- [x] **渠道导出模板分层**
    - 进展: 已新增统一分发素材包与渠道模板构建逻辑，Memos 改为服务端统一输出标题、封面、摘要、阅读全文、标签与版权尾注，WechatSync 改为基于统一素材包派生正文 / 摘要 / 封面字段，并保持现有手动同步与审计回写链路不变。
    - 验收: 为 Memos、WechatSync 等主要渠道区分正文、摘要、封面、标签与版权尾注的导出模板，不再沿用单一 Markdown / HTML 模板。
    - 验收: 模板分层不得破坏现有手动同步、重试、结果回写与分发审计链路。
    - 验收: 补齐主要渠道的模板输出测试，至少覆盖标题层级、图片、版权尾注与纯文本摘要 4 类内容差异。
- [x] **标签清洗与渠道适配规则统一**
    - 进展: 已实现标签清洗、翻译簇去重、长度限制、非法字符处理与 `#标签` / `#标签#` 双格式输出；WechatSync 前端分发改为按账户平台 profile 分组，多批次投递后仍统一回写同一个 attemptId。因微博专栏当前会返回 `CODE:004` 组件不支持错误，微博 profile 已改为不追加标签。
    - 验收：同时支持两种格式的标签：`#标签`、`#标签#` 两种格式的标签，并建立统一的清洗、去重、长度限制与非法字符处理规则，避免因格式差异导致的标签混乱。
    - 验收: 标签导出规则需与现有 taxonomy / translationId 口径保持一致，避免跨语言或同簇标签重复输出。
    - 验收: 补齐标签适配测试，至少覆盖空标签、重复标签、超长标签、非法字符 4 类场景。
    - 验收: 在使用 WechatSync 同步到第三方渠道时，可选择性地将标签格式化为 `#标签#` 或 `#标签`，并追加到正文中，以适配不同渠道的标签规范。例如，B 站专栏使用 `#标签#` 格式，小红书和 Memos 使用 `#标签` 格式、Twitter 使用 `#标签` 格式。微博专栏当前不追加标签。其他渠道暂不考虑标签适配。

### 3. Newsletter 外部分发通道扩展 (P1)

- [x] **listmonk 分发集成与配置链路打通**
    - 进展: 已接入 Campaign -> listmonk 的统一发送链路，支持默认列表与分类/标签映射、远端 Campaign 幂等更新、失败回写与后台设置配置。
    - 验收: 补齐文章或 Campaign 到 listmonk 的分发集成，明确受众映射、幂等更新与失败回写口径。
    - 验收: 同步补齐 settings / ENV / 后台配置说明与最小操作文档，避免能力只停留在代码层。
    - 验收: 补齐 listmonk 集成测试，至少覆盖首次投递、重复更新、配置缺失与远端失败回写 4 类场景。
- [x] **外部分发审计与回归补完**
    - 进展: 已将 listmonk 纳入通知投递审计通道，统一记录远端 Campaign ID、失败原因与人工处理建议，并修复文章重推复用营销发送状态机时的短路问题。
    - 验收: 新增 Newsletter 通道后，仍可统一查看最后一次分发结果、失败原因、重试记录与人工处理建议。
    - 验收: 不得因新增通道破坏现有营销推送、第三方分发状态机与后台审计口径。
    - 验收: 补齐回归验证，至少覆盖通道新增后既有分发链路不回退、审计字段完整、失败分类稳定 3 类场景。

### 4. 长文本翻译渐进式回填体验 (P1)

> 进展: 已将正文翻译收敛为单连接 SSE 增量回填，避免重复发送累计全文；标题与摘要在短文本阈值内改为 direct 直返；翻译工作流默认勾选封面同步，播客音频继续保持手动勾选，并在跨编辑器切换时保留 `coverImage` / `audio` 范围。

- [x] **流式 / 分段双模式回填**
    - 验收: 文章编辑页长文本翻译优先复用现有 `/api/ai/translate.stream`，并按文本长度在字段内实时流式回填与分段逐块回填之间自动切换。
    - 验收: 自动切换规则需覆盖标题、摘要、正文三类字段，且不导致内容错位、重复写入或编辑器状态丢失。
    - 验收: 补齐 SSE / chunk 解析与阈值切换测试，至少覆盖短文本流式、长文本分段、模式切换失败回退 3 类场景。
- [x] **字段级进度与中断恢复**
    - 验收: 对标题、摘要、正文分别展示阶段进度、已回填内容、取消 / 重试入口，避免长文翻译失败时整段结果丢失。
    - 验收: 取消、重试与失败恢复必须保留已成功回填的内容边界，不把整次翻译重新设计成黑盒重跑。
    - 验收: 补齐编辑页交互测试，至少覆盖中途取消、分段失败恢复、局部字段重试 3 类场景。

### 5. 文章详情阅读链路与 SEO 品牌强化 (P1)

> 进展: 已启动文章详情页上一篇 / 下一篇导航与 SEO 模板收敛实现，首轮仅覆盖阅读链路与品牌模板统一；相关文章推荐已在阶段审计中下沉为长期 backlog，不并入本次归档阻塞项。

- [x] **上一篇 / 下一篇导航**
    - 验收: 在文章详情页实现“上一篇 / 下一篇”导航，默认仅基于“同语言、已发布、可公开访问”文章集合，并按 `publishedAt` 计算邻接关系。
    - 验收: 明确置顶、定时发布与多语言翻译簇场景下的排序与去重边界，避免跨语言跳转和不可访问文章进入导航链路。
    - 验收: 补齐文章详情页与 posts 查询侧测试，至少覆盖首篇、末篇、置顶干扰、不可访问文章过滤 4 类场景。
- [x] **标题页 SEO 与品牌模板统一**
    - 验收: 统一文章详情页默认 SEO 模板，默认项目品牌使用“墨梅博客”，并强化“AI 驱动 / AI 博客”语义。
    - 验收: 保留站点后台 `siteTitle` 自定义能力，不强制覆盖自部署站点品牌；默认品牌仅作为模板兜底。
    - 验收: 首轮至少完成文章详情页 title、description、Open Graph / Twitter Card 与结构化数据的模板收敛，并补齐对应回归测试。
- [-] **相关文章推荐（可选增强）**
    - 处理结果: 经阶段审计后移入 [长期规划与积压项](./backlog.md)，当前不作为第十三阶段归档阻塞条件。
    - 验收: 若后续纳入实施，需按分类、标签或 translation cluster 相似度提供推荐，并避免同一翻译簇重复占位。
    - 验收: 相关文章为可选增强，不得阻塞上一篇 / 下一篇与 SEO 模板统一的首轮交付。
    - 验收: 若后续实现，需补齐推荐规则与展示回归测试。

### 插队热修复：创作资产导入导出保真 (Hotfix)

- [x] **音频元数据在导入导出时保留**
    - 进展: 已补齐 Markdown / ZIP 导出的 `metadata.audio`、`metadata.tts` 与音频兼容别名字段写出；CLI 导入同步支持从嵌套 metadata 与旧别名恢复 URL、时长、MIME、provider、locale、translationId、postId、mode 等核心字段。
    - 插队原因: 当前导入 / 导出链路若丢弃音频元数据，会削弱既有 TTS / Podcast 资产的事实源，与第十三阶段“多语言 TTS / Podcast 资产绑定”的一致性目标相冲突，属于已交付能力的资产回退风险。
    - 验收: 单篇 / 批量导出 Markdown 或 ZIP 时，保留 `metadata.audio`、`metadata.tts` 等已落盘的音频元数据，并与既有 Front-matter 映射规则兼容。
    - 验收: CLI / API 导入文章时可恢复音频 URL、时长、MIME、来源 provider、locale / translationId 关联等核心字段，不因兼容层缺失而静默丢弃。
    - 验收: 补齐导入与导出双向测试，至少覆盖仅 URL 音频、带完整元数据音频、多语言译文音频 3 类场景。

### 插队热修复：第三方分发启用开关与数据库初始化基线 (Hotfix)

- [x] **布尔型第三方启用开关识别修复**
    - 进展: 已统一第三方启用态的布尔解析口径，修复 `LISTMONK_ENABLED`、`MEMOS_ENABLED` 在服务端与后台设置页对字符串、带引号字符串及布尔值的识别与展示不一致问题，并补齐 listmonk / Memos 定向回归测试。
    - 插队原因: `LISTMONK_ENABLED`、`MEMOS_ENABLED` 等现有能力的启用态若在 ENV / 设置层以字符串 `"true"` 提供仍可能被误判为未启用，会直接阻塞当前已交付的 listmonk / Memos 分发链路，属于明确功能回归。
    - 验收: 修复第三方启用开关对字符串 `"true"`、布尔值与兼容输入的解析逻辑，统一 `LISTMONK_ENABLED`、`MEMOS_ENABLED` 等相关开关的识别口径。
    - 验收: 不得因修复启用态判断而破坏既有设置来源优先级、后台开关展示与手动同步 / 审计链路。
    - 验收: 补齐定向测试，至少覆盖 ENV 为字符串 `"true"`、数据库设置为 `"true"`、显式关闭为 `"false"` 3 类场景。
- [x] **多数据库 init.sql 与数据库设计文档同步**
    - 进展: 已同步 SQLite、MySQL、PostgreSQL 三套 init.sql，补齐广告、友链、外链、Web Push、设置审计、通知投递审计、链接治理等缺失表；同时将 post / post_version 结构升级到当前实体口径，并重写 `docs/design/database.md`，明确“实体为事实源、init.sql 为初始化派生物”的同步约束。
    - 插队原因: 当前 `database/sqlite/init.sql`、`database/mysql/init.sql`、`database/postgres/init.sql` 与 `docs/design/database.md` 已出现明显 Schema / 文档漂移，会影响新实例初始化、部署排障与数据库设计理解，属于当前交付无法绕开的基础基线缺陷。
    - 验收: 同步更新 SQLite、MySQL、PostgreSQL 的初始化 SQL，使字段、索引、默认值与当前实体定义保持一致。
    - 验收: 更新 `docs/design/database.md`，明确核心实体、初始化脚本适用边界以及与实体事实源的同步约束。
    - 验收: 补齐最小回归验证，至少确认三套初始化脚本与当前实体结构不存在显著缺字段或关键索引漂移。

## 第十四阶段：多语言配置治理与部署基线纠偏 (已审计归档)

> 审计结论: 第十四阶段五项核心任务已在代码、测试与文档中完成闭环，满足归档条件；多语言配置事实源、AI 法律文本审校链路、导入路径守卫、Cloudflare 部署边界说明与后台配置页交互统一均已完成收口。阶段审计过程中已对照代码、测试与说明文档核验，不再保留本阶段专属未完成项。

### 1. 配置项多语言国际化与回退治理 (P0)

- [x] **多语言配置模型与回退链收敛**
    - 验收: 为站点标题、关键词、公告、SEO 文案、法律文本简介等管理员可编辑配置建立多语言存储结构，并兼容现有单字符串配置。
    - 验收: 明确 `zh-TW -> zh-CN -> en-US` 与 `当前 locale -> en-US` 的读取顺序，并统一公开设置、SEO、邮件与通知链路的消费口径。
    - 验收: 补齐 settings 服务、公开接口与回退策略测试，至少覆盖旧值兼容、缺词回退、跨语言读取 3 类场景。
- [x] **后台设置页多语言编辑与迁移提示**
    - 验收: 后台设置页支持按 locale 编辑可翻译配置，并明确哪些字段仍为全局单值。
    - 验收: 提供旧配置迁移提示、缺失翻译提示与来源说明，不让管理员误以为单语言内容会自动适配所有语言。
    - 验收: 补齐设置页交互测试，至少覆盖语言切换、未保存提醒、旧值迁移展示 3 类场景。

### 2. AI 翻译扩展到可生成多语言的配置与法律文本 (P1)

- [x] **可翻译配置项 AI 草案生成**
    - 验收: 将 AI 翻译能力扩展到公告、站点介绍、SEO 文案等配置输入入口，减少管理员逐语种重复录入成本。
    - 验收: AI 生成结果需直接兼容第十四阶段的多语言配置模型，而不是额外引入一套临时存储口径。
    - 验收: 补齐配置翻译服务与后台交互测试，至少覆盖首次生成、局部重生成、人工改写后再次生成 3 类场景。
- [x] **法律文本 AI 草案到人工生效链路**
    - 验收: 为用户协议、隐私政策等合规文本建立“AI 草案 -> 人工审校 -> 激活生效”的流程，禁止将 AI 输出直接视为法律生效版本。
    - 验收: 明确草案、待审校、生效版本三类状态的展示与权限边界，避免后台误操作直接覆盖线上协议。
    - 验收: 补齐法律文本草案流程测试，至少覆盖生成草案、人工修改激活、草案废弃 3 类场景。

### 3. 迁移导入 Slug 守卫与路径别名校验 (P1)

- [x] **CLI / API 导入前路径校验**
    - 验收: 在 CLI / API 导入文章时，对 `slug`、`permalink`、`abbrlink` 执行格式、保留字、冲突与语言维度唯一性校验，避免导入后才暴露公开路径不可用问题。
    - 验收: 若源站提供的别名合法且无冲突，默认沿用，不擅自重写。
    - 验收: 补齐导入校验测试，至少覆盖合法沿用、保留字拒绝、跨语言冲突 3 类场景。
- [x] **冲突审计与人工确认回退**
    - 验收: 对非法、冲突或语义不完整的路径别名提供显式修复、回退或人工确认分支，不进行静默替换。
    - 验收: 为批量导入输出结构化报告，记录跳过、修复、回退与冲突处理结果。
    - 验收: 补齐批量导入回归测试，至少覆盖 dry-run 报告、人工确认取消、重复执行可复跑 3 类场景。

### 4. Cloudflare 部署支持声明纠偏 (P1)

- [x] **平台能力声明收口**
    - 验收: 修正文档、快速开始、功能介绍与设计说明中“可直接部署到 Cloudflare Pages / Workers”的表述，明确当前受 TypeORM 运行时限制，项目暂不支持在 Cloudflare 运行时完整部署。
    - 验收: 区分“Cloudflare R2 / Scheduled Events 等外围能力可接入”与“应用主体可在 Cloudflare 运行时部署”两类能力，避免用户误把局部支持理解为整站可部署。
    - 验收: 补齐相关文档同步检查，至少覆盖 README、部署说明、功能介绍 3 类入口。
- [x] **部署矩阵与排障文案同步**
    - 验收: 同步更新部署矩阵、平台比较、排障文档与对外入口文案，避免仓库内外对 Cloudflare 支持边界表述不一致。
    - 验收: 若未来形成可行适配层，应保留独立重新评估入口，而不是预先承诺当前已支持。
    - 验收: 补齐文档回归检查，至少确认不存在与当前边界冲突的旧表述残留。

### 5. 后台配置页动作与反馈入口统一 (P1)

- [x] **悬浮保存入口统一**
    - 验收: 系统设置与其他后台配置页的保存动作统一为右下角悬浮样式，减少长页表单的保存查找成本。
    - 验收: 统一后的保存入口不得破坏现有禁用态、脏表单检测与多语言设置页的交互逻辑。
    - 验收: 补齐配置页交互测试，至少覆盖滚动场景、未保存状态、保存成功反馈 3 类场景。
- [x] **反馈入口显性化与可用性回归**
    - 验收: 将反馈入口收敛为更明确的问号图标与一致文案，并在公开侧与后台侧统一显隐逻辑。
    - 验收: 区分项目问题与第三方自部署站点问题的反馈流向，不让用户误入错误渠道。
    - 验收: 补齐移动端 / 窄屏场景与固定按钮遮挡回归，确保统一交互不引入误触。

---

## 第十五阶段：AI 协作治理与国际化文档收敛 (已审计归档)

> 审计结论: 第十五阶段围绕 AI 治理事实源、验证矩阵、周期性回归模板、文档国际化目录迁移与 `ja-JP` 准入的核心目标已在代码、规范、计划文档和翻译目录中完成闭环。阶段收口期间额外清理了 `.claude/skills/git-flow-manager` 残留空目录，并扩展 `scripts/ai/check-governance.mjs` 以检测镜像侧多余文件 / 目录；首次回归基线已独立沉淀到 [regression-log.md](./regression-log.md)，作为下一阶段专项回归的比较起点。本阶段不再保留专属未完成项。

### 1. AI Agent / Skills 治理、Rules 边界与复用收敛 (P0)

- [x] **权威文件收敛与冲突顺序明确**
    - 验收: 明确以 `AGENTS.md` 作为平台无关的唯一权威事实源；`CLAUDE.md`、`docs/guide/ai-development.md` 与其他平台适配文档仅承担适配与补充说明，不再与 `AGENTS.md` 并列定义核心规则。
    - 验收: 明确冲突处理顺序：`AGENTS.md` 优先于平台专属说明；若平台能力受限，仅允许补充“工具差异”，不允许覆盖项目级行为准则。
    - 验收: 补齐文档与入口审计，至少覆盖权威文件、平台适配文件与开发入口说明 3 类场景。
- [x] **工作流细化与推荐矩阵**
    - 验收: 为 `@full-stack-master`、`@product-manager`、`@test-engineer`、`@code-auditor`、`@documentation-specialist` 等核心智能体明确适用场景、输入输出、必经交接点与不应承担的职责边界。
    - 验收: 明确默认推荐路径：需求澄清优先交给产品经理，代码实现由全栈 / 前后端开发者承担，代码改动收尾必须进入 `code-auditor` Review，测试补强交由 `test-engineer`，文档沉淀交由 `documentation-specialist`。
    - 验收: 禁止多个智能体在同一阶段重复承担同类职责，并补齐最小示例或矩阵说明。
- [x] **库存对齐、Skills 复用与冗余裁剪**
    - 验收: 对齐 `AGENTS.md`、`CLAUDE.md`、`docs/guide/ai-development.md`、`.github/agents/`、`.github/skills/` 与 `.claude/agents/`、`.claude/skills/` 的实际清单，消除角色名、路径、fallback 约定与推荐用法漂移。
    - 验收: 清理未使用、重复、失效或职责高度重叠的 agent / skill，优先收敛为“一套主定义 + 平台适配镜像”的结构，避免双份说明长期分叉。
    - 审计补充: 已删除 `.claude/skills/git-flow-manager` 残留空目录，并把镜像侧多余文件 / 目录检测纳入 `pnpm ai:check`。
- [x] **Rules 层最小化与平台适配**
    - 验收: 为 Cursor / Codex / Copilot Workspace 等工具补齐轻量 `Rules` / `Instructions` 入口，但内容必须复用 `AGENTS.md`、规划规范、开发规范与安全规范，优先引用或摘要，而不是重复维护大段文本。
    - 验收: 建立 Rules 作用边界：仅补充工具差异、触发顺序与最小执行门禁，不在 Rules 层重新发明业务规范、项目流程或安全红线。
    - 验收: 补齐平台差异清单，至少覆盖 GitHub Copilot、Claude 系工具与一类 Rules-only 工具 3 种入口。
- [x] **配置体检与最小验证闭环**
    - 验收: 清理无效 Frontmatter、失效链接与不再存在的技能引用，补齐最小校验流程，避免 agent / skill 因解析错误而失效。
    - 验收: 为 agent / skill 治理补充最小自动化检查，确保目录变动后能发现孤儿文件、无引用定义、镜像侧额外残留与文档漂移。
    - 验收: 输出格式至少包含问题清单、影响范围、修复建议与可延后事项 4 类字段。

### 2. 自动化验证分级、周期性回归与 Review Gate (P0)

- [x] **验证矩阵与 Review Gate 收敛**
    - 验收: 建立逻辑、接口、跨模块流程、UI 浏览器验证、Lighthouse / Bundle 预算与 Review Gate 的统一分级矩阵，并明确不同改动类型的最低验证要求。
    - 验收: 任何代码、配置、脚本与文档改动完成后都需保留对应的检查清单与 Review 结论，不再以“已验证”替代证据链。
    - 验收: 补齐规范与模板，至少覆盖功能改动、修复型 Hotfix、文档 / 配置变更 3 类场景。
- [x] **周期性回归清单与漂移治理**
    - 验收: 整理需要定期回归的事项，至少覆盖代码优化与复用收敛、ESLint warning / 类型债治理、`database/*/init.sql` 与实体 / 设计文档同步、README / 部署 / 翻译文档同步、i18n 初始化字段完整性、测试用例补齐、性能基线漂移、依赖安全审计，以及 `scripts/**` 中未使用长期脚本、失效入口引用、临时脚本残留与无效脚本的定期清理。
    - 验收: 明确这些事项默认属于独立治理任务，不自动膨胀进普通功能需求；仅在阻塞交付或构成功能回归时允许插队。
    - 验收: 补齐回归任务模板，至少覆盖回归范围、触发条件、执行频率、timeout budget 与输出格式。
- [x] **AI 多代理编排约束补齐**
    - 验收: 明确多代理能力的适用范围、单一主责收口原则、共享写入面的串行落盘约束，以及工具不支持时的回退路径说明。
    - 验收: 在规范与开发入口文档中同步“并行检索 / 串行落盘”的治理约束，避免多代理误用为多主责并行开发。
- [x] **覆盖率门槛与全量测试 timeout budget**
    - 验收: 回归任务必须补充或修正测试用例，维持全项目覆盖率不低于现行门槛，且不得让核心模块覆盖率基线继续下滑。
    - 验收: 回归任务允许执行全量 `pnpm test`、`pnpm test:coverage` 与 `pnpm verify`，但必须声明显式 timeout budget，不得使用无限等待。
    - 验收: 补齐最小执行约定，至少覆盖定向测试、全量测试、coverage 与 verify 4 类命令的预算或升级条件。
- [x] **回归任务记录独立归档**
    - 验收: 将首次回归基线迁移到 [regression-log.md](./regression-log.md)，并同步收敛 `todo.md`、规划规范与文档规范中的回归记录入口。
    - 验收: 后续周期性回归统一在独立文档中连续沉淀，`todo.md` 与 `roadmap.md` 仅保留阶段上下文、摘要与入口链接。

### 3. 文档国际化目录重构 (P1)

- [x] **翻译文档目录与 URL 约束收敛**
    - 验收: 形成 `docs/i18n/<locale>/` 的目录迁移方案，同时保持外部文档站继续使用 `/<locale>/...` 路由，不将仓库路径结构直接暴露为公共 URL。
    - 验收: 明确过渡期兼容映射与分批迁移策略，避免一次性硬切导致死链与编辑入口失效。
    - 验收: 补齐迁移审计，至少覆盖历史引用、构建产物与相对路径 3 类场景。
- [x] **文档站配置与规范同步**
    - 验收: 同步更新 VitePress locale 配置、导航 / 侧边栏、编辑链接映射、Translation Notice 与文档规范中的路径说明。
    - 验收: 明确新增翻译页的 Frontmatter、原文回链与相对路径生成约束，不再允许新旧目录混用。
    - 验收: 补齐文档构建与重复页检查，至少覆盖英文、繁体中文、韩语 3 类现有翻译目录。

### 4. 日语界面与文档支持 (P1)

- [x] **`ja-JP` 准入与 UI 范围收敛**
    - 验收: 在 `Locale Registry` 中为 `ja-JP` 建立正式准入项，首轮优先覆盖公开界面、认证、设置、安装引导与核心邮件模板。
    - 验收: 沿用“先 `ui-ready`、后 `seo-ready`”的开放节奏，在关键链路未稳定前不提前开放索引。
    - 审计补充: 当前以 `ui-ready` 口径收口；`seo-ready` 与更广范围的后续回归仍留待后续阶段独立评估。
- [x] **日语文档范围与质量门禁**
    - 验收: 日语文档首轮仅覆盖 README、核心 Guide、路线图摘要与必要贡献入口，不默认要求 `docs/design/modules/` 全量翻译。
    - 验收: 建立术语表、翻译声明模板与同步节奏，不让 `ja-JP` 的引入破坏现有 `zh-TW`、`ko-KR` 的收口质量。
    - 审计补充: 已完成首轮 README、首页、快速开始、翻译治理与路线图摘要同步；后续若扩大范围，仍需按 `ui-ready -> seo-ready` 节奏推进。

---

## 第十六阶段：规范事实源收敛与专项回归治理 (已审计归档)

> 审计结论: 第十六阶段围绕规范事实源收敛、Review Gate 审查闭环、Skills / Agents 镜像治理，以及三类专项回归任务的核心目标已在代码、测试、规划文档与回归记录中完成闭环。阶段收口期间补齐了 `server/services/migration-link-governance.ts`、`server/services/setting.ts` 与 AI 文本服务的结构收敛，完成根 README 多语入口与数据库初始化脚本关键约束纠偏，并以 [regression-log.md](./regression-log.md) 沉淀了代码质量、文档 / 配置 / 数据库、测试 / 性能 / 依赖安全三条专项回归证据链。本阶段不再保留专属未完成项。

### 1. 规范文档事实源收敛与过时内容纠偏 (P0)

- [x] **规范去重、Git 回链与示例最小化**
    - 验收: 收敛 `development`、`testing`、`documentation`、`ai-collaboration`、`AGENTS.md` 中重复的门禁、流程与检查项，优先改为“唯一事实源 + 链接引用”。
    - 验收: `AGENTS.md` 中与 Git、Worktree、提交流程相关的细则进一步回链到 `docs/standards/git.md`，不再长期双写。
    - 验收: 清理规范文档中没有必要的样板代码示例，仅保留项目特有、易错且无法仅靠文字精确描述的最小示例。
- [x] **API / 安全 / 性能规范重写与边界收敛**
    - 验收: `docs/standards/api.md`、`docs/standards/security.md`、`docs/standards/performance.md` 与当前请求层、权限边界、依赖治理和性能预算保持一致。
    - 验收: 邮件模板、变量与投递实现细节从总规范中下沉到对应模块设计文档，避免总规范再次膨胀。
    - 验收: 补齐规范回链与最小审计记录，明确每份文档的唯一事实源和非目标内容边界。

### 2. Review Gate 审查闭环与证据自动化 (P0)

- [x] **Code Auditor 审查结构化与多轮 Review 固化**
    - 验收: `code-auditor` 与相关审查技能的输出必须明确失败原因、通过条件、检查点列表、阻塞级别与复查基线，不再只给出松散问题列表。
    - 验收: 建立不纳入 Git 的临时审查记录机制，用于问题对账、续查和多轮 review 状态延续。
    - 验收: 明确“规划 / 文档 / 配置 / 脚本 / 代码改动提交前至少 review 一轮，必要时多轮复查”的固定流程与证据要求。
- [x] **按改动类型执行验证命令的统一口径落地**
    - 验收: 将“代码改动走 `lint` / `typecheck`，样式改动补 `lint:css`，Markdown / 文档改动补 `lint:md`，测试按风险升级”的规则同步到规范、skills 与 agents。
    - 验收: 明确 test 是默认补充项而非所有场景一刀切全量执行，并给出可直接复用的验证矩阵示例。
    - 验收: 同步收敛文档、配置、脚本与治理型改动的 Review Gate 证据链格式，避免不同入口重复定义口径。

### 3. Skills / Agents 分层治理与工作流镜像修正 (P0)

- [x] **内部 / 外部技能分层与库存治理规范补齐**
    - 验收: 明确项目内部维护的 skills / agents 与外部同步技能的目录边界、更新方式、失效处理策略和维护责任。
    - 验收: 为 skills / agents 的命名、库存、镜像、生命周期、弃用与清理建立正式管理规范，并补齐引用关系要求。
    - 验收: 治理脚本至少能够发现镜像漂移、额外残留目录 / 文件与长期未引用定义。
- [x] **Full Stack Master 的 PDTFC+ 流程纠偏与镜像同步**
    - 验收: 修复 `full-stack-master` 中 PDTFC+ 工作流的错误或歧义，明确 Plan / Do / Audit / Validate / Test / Finish 的职责边界与交接顺序。
    - 验收: 同步修正文档、主定义与镜像文件，避免 `.github/` 与 `.claude/` 在同一角色上长期漂移。
    - 验收: 复核默认开发路径与专项角色边界，确保多代理编排不改变单一主责收口原则。

### 4. 专项回归：代码质量与结构收敛 (P0)

- [x] **ESLint warning、类型债与大文件拆分回归**
    - 验收: 形成 ESLint warning、类型债、`max-lines` 豁免和超长文件的分层清单，区分阻塞项、warning 与可延期项。
    - 验收: 优先通过合理拆分、复用公共 utils / 组件 / 样式片段收敛大文件，而不是继续新增长期豁免或禁用注释。
    - 验收: 回归记录需写明回归范围、触发条件、timeout budget、已执行命令、Review Gate 结论与未覆盖边界。
- [x] **复用治理与脚本目录残留清理回归**
    - 验收: 梳理 `scripts/**` 中未使用长期脚本、临时脚本残留、失效入口引用与重复逻辑，并给出“保留 / 合并 / 删除”处理结论。
    - 验收: 为 `scripts/` 目录补 README 与入口索引，说明脚本分类、调用入口、副作用范围和引用关系。
    - 验收: 至少补一轮定向验证，确认脚本入口与规范文档中的命令说明一致。

### 5. 专项回归：文档、配置与数据库基线同步 (P0)

- [x] **README / 部署 / 翻译文档 / 配置说明同步回归**
    - 验收: 根目录多语 README、部署指南、翻译治理、环境变量与系统设置说明与当前能力保持一致，不再保留过时平台声明和旧路径引用。
    - 验收: 至少覆盖中文、英文、繁体中文、韩语、日语 5 类入口的路径、术语和能力边界复核。
    - 验收: 将回归结果沉淀到 `docs/plan/regression-log.md`，明确问题分级、补跑计划与是否阻塞发版。
- [x] **`database/*/init.sql`、实体与设计文档同步回归**
    - 验收: 对齐 SQLite、MySQL、PostgreSQL 初始化脚本与当前实体定义、`docs/design/database.md`、相关模块设计文档的关键字段与索引。
    - 验收: 形成结构化漂移记录，明确“代码事实源 / 初始化派生物 / 设计文档”的职责边界与修复优先级。
    - 验收: 至少补齐一轮最小验证，确认不存在关键缺字段、核心索引漂移或初始化失败风险。

### 6. 专项回归：测试、性能与依赖安全干净基线 (P0)

- [x] **零异常日志 smoke 基线回归**
    - 验收: 清理 `pages/login.test.ts` 的 Sentry DSN 初始化噪音、`app.test.ts` 中 `/api/install/status` 未 mock 的 FetchError 噪音，以及相关 Better Auth warning，形成更干净的第二版 smoke 基线。
    - 验收: 至少按首次回归基线中的 smoke 组合重跑一轮，记录 V1 / V2 结果、问题分级与残余风险。
    - 验收: 若仍存在非阻塞噪音，必须明确其影响范围、延期理由与后续补跑触发条件。
- [x] **覆盖率、浏览器验证、性能预算与依赖安全回归**
    - 验收: 基于周期性回归模板安排 coverage、V3 浏览器级验证与按需 V4 性能验证，并声明显式 timeout budget。
    - 验收: 发版前或阶段收口前重新执行依赖安全审计，复核 `html-minifier` high 风险是否仍无补丁，并给出继续延期或计划替换的明确判断。
    - 验收: 在 `docs/plan/regression-log.md` 中输出已执行验证、结果摘要、Review Gate 结论、未覆盖边界与后续补跑计划，不得只写“已回归”。

---

## 第十七阶段：配置事实源复用与创作 / 分发效率收敛 (已审计归档)

> 审计结论: 第十七阶段围绕配置事实源复用、认证会话治理、后台邮件模板配置、Serverless 长文本翻译续跑，以及 AI 视觉资产 / 存量资源迁移扩展的核心目标已在代码、测试、规划文档与回归记录中完成闭环。阶段收口期间新增的 release 依赖风险门禁与后台新建文章空草稿跨语言切换回归也已完成修复与验证，并分别沉淀到 [regression-log.md](./regression-log.md#release-依赖包风险门禁回归2026-03-22) 与 [regression-log.md](./regression-log.md#文章新建页多语言切换回归2026-03-22)。本阶段不再保留专属未完成项。

### 1. 主线：安装向导与后台设置多语言字段收敛 (P0)

- [x] **统一安装向导与后台设置的多语言配置模型**
    - 验收: 安装向导中的站点标题、描述、品牌文案等初始化字段与后台设置页复用同一套 locale-aware settings 模型、回退解析器与元信息结构，不再维护 installation 专用事实源。
    - 验收: installation 页面默认只编辑当前 locale 的值，后台设置页承担后续多语言扩展编辑；默认语言写入、追加语言编辑与 legacyValue 兼容不能互相覆盖。
    - 验收: 至少补齐安装流程、后台设置页与公开设置消费链路的定向回归，确认默认值、fallback 与多语言追加编辑稳定。

### 2. 主线：认证会话获取频率治理 (P0)

- [x] **收敛 `/api/auth/get-session` 调用频率与会话读取链路**
    - 验收: 梳理公开端、管理端、插件、中间件、composable 与布局层对 `/api/auth/get-session` 的调用来源，形成 SSR 首屏、hydration、导航、聚焦恢复与重复挂载的调用基线。
    - 验收: 为 `authClient`、`useAsyncData`、全局状态与请求层建立短时缓存、请求合并与失效时机策略，显著减少重复会话请求但不破坏权限判断与用户体验。
    - 验收: 至少补齐登录态初始化、登出同步、会话过期、多标签页切换与页面刷新 5 类回归验证。
    - 实施记录: 已完成统一会话读取层、请求层短时缓存 / 合并 / 失效广播、路由守卫链路收敛，以及登录 / 注册 / 登出 / 资料更新 / 头像上传的会话刷新闭环。
    - 验证记录: 见 [认证会话获取频率治理回归（2026-03-21）](./regression-log-archive.md#认证会话获取频率治理回归2026-03-21)。

### 3. 主线：后台邮件模板配置能力 (P1)

- [x] **提供后台邮件模板配置与预览最低闭环**
    - 验收: 在后台管理中增加邮件模板配置入口，支持模板选择、变量说明、启停、预览或等效最低可用能力。
    - 验收: 邮件模板的主题、正文、多语言文案与变量说明并入现有 i18n 国际化体系，不再维护模板专用国际化字段或第二套 locale 事实源。
    - 验收: 至少补齐模板读取、变量替换与后台交互的定向测试，并同步必要文档。

### 4. 主线：长文本翻译在 Serverless 平台的超时续跑修复 (P1)

- [x] **补齐长文本翻译在 Vercel 场景下的超时恢复与继续执行闭环**
    - 验收: 针对 Vercel Hobby 版最长 60 秒执行限制，长文本翻译需收敛为“非云函数环境继续使用 SSE 长连接、云函数环境自动回退为后端任务 + 前端轮询”的单一路径，并明确环境判定、契约边界与前端状态切换逻辑。
    - 验收: 超时、中断或单段失败后能够保留已完成块并自动继续，避免用户手动从整篇开头重新翻译；兼容标题、摘要、正文的分段回填与重试。
    - 验收: 至少补齐长文本阈值切换、SSE / 轮询策略切换、超时恢复、块合并 / 去重与 Vercel 部署边界说明的定向验证。

### 5. 扩展：AI 视觉资产收敛 (P1)

- [x] **合并封面五维提示词与图片生成扩面治理**
    - 验收: 将封面提示词收敛为“类型、配色、渲染、文本、氛围”五维模型，明确各维度的输入来源、默认回退与可编辑覆盖策略。
    - 验收: 将 AI 图片生成能力从封面扩展到文章配图、专题头图、活动图等场景，并明确“自动回填”与“仅生成候选图待人工确认”的边界。
    - 验收: 补齐参数约束、编辑流程与回归记录，避免视觉资产链路继续分散演进。
    - 实施记录: 已新增统一的 `assetUsage` / `applyMode` / `promptDimensions` 契约、五维提示词共享解析器、`metadata.visualAssets` 事实源，以及文章编辑器内“封面 + 配图”双入口。
    - 验证记录: 见 [AI 视觉资产收敛回归（2026-03-22）](./regression-log.md#ai-视觉资产收敛回归2026-03-22)。

### 6. 扩展：存量资源链接重写与迁移工具 (P1)

- [x] **建立存量资源链接重写、预览与回退最小闭环**
    - 验收: 支持对存量资源链接执行批量重写、域名过滤、dry-run 预览与差异报告导出。
    - 验收: 与当前存储配置、路径前缀、公共 Base URL 与权限模型保持一致，不绕开既有上传与访问控制链路。
    - 验收: 至少覆盖仅预览、部分命中、全量重写与失败回退 4 类场景的最小验证。
    - 实施记录: 已补齐后台管理端 dry-run / apply 执行面板、差异预览弹窗、JSON / Markdown 导出、admin 侧执行接口，以及 apply 必须绑定已审阅 dry-run 报告的最小防误写约束。
    - 验证记录: 已通过 `server/services/migration-link-governance.test.ts`、`tests/server/api/admin/link-governance-run.test.ts`、`tests/server/api/external/link-governance.test.ts` 与 `tests/pages/admin/migrations/link-governance.test.ts` 定向回归，覆盖仅预览、apply 执行、前缀过滤跳过与后台页面入口。

### 7. 收口修复：发版依赖风险门禁与文章多语言切换回归 (P0)

> 插队原因: 两项均不属于新功能扩张。其中依赖风险门禁直接影响 release 放行，属于发版阻塞型安全治理；文章新建页语言切换问题属于既有多语言创作链路的明确回归，会阻断同翻译簇草稿创建闭环，符合当前阶段收口修复准入。

- [x] **为 release 增加依赖包风险门禁脚本**
    - 验收: 在 release 流程中新增可复现的依赖风险审计脚本，优先消费仓库安全告警或等价官方来源；若存在新的未解决依赖风险，必须阻止 release 继续执行。
    - 验收: 支持维护“已知、影响范围明确、当前批准暂时放行”的依赖风险白名单或等价基线；命中白名单时 release 可继续，但必须输出清晰日志，标明包名、风险级别、原因、来源与暂时放行依据。
    - 验收: 不把该需求扩写为整仓库依赖大升级；至少补齐脚本级定向测试或等价验证，并同步 release 工作流 / 文档中的执行入口。
    - 实施记录: 已新增 `scripts/security/check-dependency-risk.mjs`、`.github/security/dependency-risk-allowlist.json` 与 `pnpm security:audit-deps`，白名单需绑定已批准依赖路径，并将该门禁接入 `package.json` release 入口与 `.github/workflows/release.yml`。
    - 验证记录: 见 [release 依赖包风险门禁回归（2026-03-22）](./regression-log.md#release-依赖包风险门禁回归2026-03-22)。

- [x] **修复新建文章空草稿无法从默认语言切换到其他语言的问题**
    - 验收: 在后台新建文章页中，若当前文章尚未保存且内容仍为空，允许从默认语言切换到其他语言创建新草稿，不再错误提示“需要先保存”。
    - 验收: 若当前新建文章已录入标题、正文、摘要、slug、标签、分类、封面或其他会造成上下文丢失的内容，仍保持现有保护策略，避免用户误切换导致内容丢失。
    - 验收: 至少补齐文章编辑器语言切换的定向回归，覆盖“空白新建草稿可切换”和“已录入内容的新建草稿仍需确认或先保存”两类场景。
    - 实施记录: 已在 `use-post-editor-translation` 中将新建草稿的切换保护收敛为“仅当存在实质内容时阻止切换”；空白新建草稿允许直接跳转到目标语言新建页，并保留 `sourceId` / `translationId` 翻译上下文。
    - 验证记录: 见 [文章新建页多语言切换回归（2026-03-22）](./regression-log.md#文章新建页多语言切换回归2026-03-22)。

---

## 第十八阶段：验证基线深化与国际化维护能力收敛 (已审计归档)

> 审计结论: 第十八阶段围绕多引擎浏览器验证与性能预算基线、MJML 依赖链 high 风险替换、后台 admin locale 大文件拆分、`ja-JP` 正式对齐，以及 WechatSync 微博兼容 / 同步前预检预览、后台翻译工作流标签进度展示等收口事项，已在代码、测试、规划文档与回归记录中完成闭环，满足归档条件。原计划中的“重复代码治理与纯函数复用基线建设”因阶段容量控制未并入执行，现保留在 [backlog.md](./backlog.md) 中继续评估，不再作为本阶段阻塞项。

### 1. 主线：浏览器验证与性能预算基线深化 (P0)

- [x] **补齐 Firefox / WebKit / 移动端关键链路验证，并收敛异步大包预算**
    - 验收: 将认证会话治理、后台受保护页面访问与文章创作主链路的浏览器验证从 Chromium 扩展到 Firefox / WebKit；至少覆盖多标签同步、刷新恢复、未登录跳转、空白新建草稿切换语言与已录入草稿保护 5 类关键场景。
    - 验收: 明确移动端或窄视口下的最小关键路径验证口径，至少覆盖登录入口、后台导航与文章编辑器核心交互，不再只停留在桌面 Chromium。
    - 验收: 收敛当前 `maxAsyncChunkJs` 超预算问题，并补齐 bundle budget、Lighthouse 或等价性能验证记录，明确剩余边界与后续补跑条件。
    - 结果: 已新增 Firefox / WebKit 桌面浏览器矩阵与 `mobile-chrome-critical` / `mobile-safari-critical` 移动关键路径项目；文章编辑器新增空白新稿语言切换、未保存新稿保护与移动端编辑 smoke 覆盖。Markdown 格式化逻辑已从渲染器拆出，`markdown-it-emoji` 切到 `light`，`highlight.js` 改为 core + 常用语言按需注册，并补入更细粒度的 vendor chunk 拆分。
    - 验证: `pnpm exec playwright test tests/e2e/auth-session-governance.e2e.test.ts --project=chromium`、`--project=firefox`、`--project=webkit` 全部通过；`pnpm exec playwright test tests/e2e/mobile-critical.e2e.test.ts --project=mobile-chrome-critical`、`--project=mobile-safari-critical` 通过；`pnpm build` 通过；`pnpm test:perf:budget` 输出 `coreEntryJs 139.65KB / 260KB`、`maxAsyncChunkJs 0KB / 120KB`、`keyCss 11.36KB / 70KB`。
    - 边界: 本轮性能基线使用“非 vendor 异步页面 chunk”口径；共享 vendor chunk 仍保留在构建产物中，后续若引入真正的 Vite/Nuxt manifest 可再升级为更细粒度的 async 图谱统计。

### 2. 主线：MJML 依赖链高风险替换与 release 安全基线收敛 (P0)

- [x] **处理 `html-minifier` high 风险的上游链路替换或可验证缓解**
    - 验收: 明确 `mjml` / `mjml-cli` -> `html-minifier` 风险的替换方案、影响范围、回退策略与阶段边界，不再长期仅依赖 allowlist 放行。
    - 验收: 若可在本阶段完成升级或替换，需补齐 release 门禁、邮件模板渲染、构建与定向测试验证；若仍需延期，必须形成更严格的处置结论、缓解口径与触发条件。
    - 验收: 不将该事项扩写为整仓库依赖大升级工程，范围仅围绕当前 release 阻塞链路与其直接影响面。
    - 结果: 已通过 `package.json` 中的 direct alias + `pnpm.overrides` 将 `html-minifier` 统一替换为 `html-minifier-terser@^7.2.0`，并恢复 Nitro `externals.inline` 以确保 `mjml` / `mjml-core` / `html-minifier` 相关模块在服务端构建链路中稳定解析；`.github/security/dependency-risk-allowlist.json` 已清空，不再依赖长期 allowlist 放行该 high 风险。
    - 验证: `pnpm install --lockfile-only` 与 `pnpm install --frozen-lockfile` 完成依赖图刷新和实际安装；随后 `pnpm security:audit-deps` 输出 `relevant risks: 0` 并通过；`pnpm exec vitest run server/services/email-template.test.ts server/services/email-template.integration.test.ts tests/scripts/check-dependency-risk.test.ts` 通过，合计 3 个测试文件、15 个用例；补跑 `pnpm test` 全量 Vitest 通过（31 个测试文件）；`pnpm build` 通过；补跑 `pnpm test:e2e` 时全量 Playwright 结果为 `69 passed / 51 skipped / 3 flaky / 128 failed`，失败主因是测试过程中 `localhost:3001` 服务中途失联，后续大量用例统一报 `Connection refused`。
    - 边界: 本轮未扩写为 `mjml` 主版本升级或整仓库依赖升级工程，仅替换 release 阻塞链路中的 `html-minifier` 实现；全量 Vitest 已通过，但全量 E2E 当前暴露的是现有浏览器基线 / 测试服务稳定性问题，而非已定位到 MJML 替换本身的断言回归。若后续 MJML 上游发布官方修复版本，可优先回收 alias / override 并重新评估 Nitro 内联名单是否仍有必要。

### 3. 主线：后台 admin locale 大文件拆分与加载注册表治理 (P0)

- [x] **拆分 `i18n/locales/*/admin.json` 并收敛后台 locale 模块注册**
    - 验收: 将后台大文件按稳定域拆分为多个 locale module 文件，例如设置、用户、文章、AI、邮件模板等域，避免继续维持单一超大事实源。
    - 验收: locale 加载层、消息合并策略与注册表同步适配新的 admin 模块结构，不破坏现有 `t()` key 路径与后台页面读取方式。
    - 验收: 至少补齐一次 i18n audit、后台相关定向测试或等价验证，确认拆分后无 key 丢失、覆盖顺序错误或 locale 漏载。
    - 结果: `admin.json` 已收敛为后台壳层模块，并新增 `admin-posts`、`admin-settings`、`admin-users`、`admin-ai`、`admin-email-templates` 等稳定子模块；`i18n/config/locale-modules.ts` 已按后台路由接入按需加载注册。
    - 验证: `CI=1 pnpm exec vitest --run --reporter=verbose i18n/config/locale-modules.test.ts` 通过；`CI=1 pnpm exec vitest --run --reporter=verbose i18n/config/locale-runtime-loader.test.ts` 通过；`pnpm i18n:audit` 通过。

### 4. 主线：`ja-JP` 正式对齐治理 (P1)

- [x] **完成 `ja-JP` 正式对齐，并评估从 `ui-ready` 升格的条件**
    - 验收: 补齐 `ja-JP` 与 `en-US` / `zh-TW` / `ko-KR` 在核心 i18n 字段、后台 locale 模块、邮件模板文案与初始化字段审计上的 parity 对齐。
    - 验收: 文档侧至少同步 README 镜像、`docs/i18n/ja-JP/**`、翻译治理说明与文档规范中的语言阶段描述，不再沿用“仅首轮覆盖”的历史口径。
    - 验收: 若实施过程中需要提升 locale registry、文档导航或审计脚本门禁，应同步补齐必要验证与说明，避免其他语种继续沿用旧分级假设。
    - 结果: 已新增 `scripts/i18n/check-locale-parity.mjs` 与 `pnpm i18n:check-sync`，统一以 `zh-CN` 为基准输出各 locale / module 的缺失字段与多余字段；本轮补齐 `admin-snippets`、`admin-users`、`admin-submissions`、`admin-taxonomy` 以及 `demo`、`feed` 后，`pnpm i18n:check-sync -- --locale=ja-JP` 已返回 `ja-JP: parity with zh-CN`。
    - 验证: locale registry 已将 `ja-JP` 升格为 `seo-ready`，并同步开启 `indexable`、`sitemapEnabled` 与 `feedEnabled`；`pnpm vitest run i18n/config/locale-registry.test.ts server/utils/sitemap.test.ts server/services/email-template.integration.test.ts server/utils/email/locale.test.ts` 通过，覆盖了 registry、sitemap 与邮件模板运行时 locale 链路；`tests/e2e/seo-regression.e2e.test.ts` 已补入 `ja-JP` 首页与静态页断言，作为后续浏览器回归入口。

### 5. 插队修复：WechatSync 微博同步兼容与同步前检查/预览收口 (P1)

- [x] **修复 WechatSync 微博平台同步错误，并补齐同步前内容检查/预览**
    - 插队原因: WechatSync 已属于当前已交付的多平台分发链路；微博平台同步错误会直接造成既有能力不可用，属于明确回归修复。
    - 验收: 明确微博平台当前报错的根因、影响范围与回退口径，修复已知的同步失败问题，不再仅停留在“已知限制”说明。
    - 验收: 在同步前补齐最小内容检查与预览，至少覆盖账号选择、目标平台内容兼容性检查，以及最终投递标题、摘要、正文、标签/版权尾注等核心素材的只读预览或等价结构化预览，避免用户提交后才发现不可同步或投递内容与预期不符。
    - 验收: 补齐 WechatSync 相关定向验证或测试，确认微博修复与同步前检查/预览逻辑不会破坏其他平台的现有同步链路。
    - 结果: 已确认微博 `CODE:004` 的当前根因之一是微博兼容 payload 仍保留版权尾注分隔线 `----------`，会被 WechatSync 识别为不支持的组件格式；共享分发模板现已在微博 profile 下移除分隔线，并继续保留对引用块、代码样式、标题锚点、图片容器等结构的自动降级。同步前预览与真实发送继续复用同一套共享构造，微博批次会省略显式 `markdown` 字段，改为仅投递兼容后的 HTML 内容。
    - 验证: `pnpm exec vitest run utils/shared/distribution-template.test.ts utils/shared/post-distribution-preview.test.ts utils/shared/post-distribution-precheck.test.ts` 通过，合计 9 个用例，覆盖微博兼容模板、同步前预览和 blocker/warn 预检；`pnpm exec nuxt typecheck` 通过；`pnpm exec lint-md docs/plan/todo.md --fix` 通过。
    - 边界: 本轮已完成活跃 WechatSync 分发链路的共享模板、预检与预览收口，但尚未补真实 WechatSync 插件联调或浏览器级 E2E 证据；另外，遗留 `components/admin/posts/wechatsync-button.vue` 仍未接入新分发面板的 attempt 建档、完成回写与完整预检/预览 UI，后续若继续保留该组件，建议进一步收口或直接移除。

### 6. 扩展：后台翻译工作流标签进度展示补齐 (P1)

- [x] **将标签翻译纳入后台翻译工作流进度条展示**
    - 验收: 后台翻译工作流在勾选 `tags` 范围时，进度条与字段状态展示必须体现标签翻译，而不再只覆盖标题、摘要与正文。
    - 验收: 标签翻译进度的计算、完成态与失败态需与现有翻译工作流保持一致，不破坏既有文本字段的流式或任务式翻译行为。
    - 验收: 补齐对应的定向测试、交互验证或等价检查，确认标签翻译进度展示与实际翻译结果一致。
    - 结果: `PostTranslationProgress` 已扩展为包含 `tags` 的独立进度字段；`use-post-translation-ai` 新增辅助字段进度状态机，`use-post-editor-translation` 已在标签绑定解析前后驱动 `processing / completed / failed` 状态；后台翻译工作流对话框现在会在勾选 `tags` 时渲染标签进度卡片，并保持标签字段不可误触发文本字段的取消 / 重试入口。
    - 验证: `pnpm typecheck` 通过；`pnpm exec vitest run composables/use-post-translation-ai.test.ts composables/use-post-editor-translation.test.ts components/admin/posts/post-translation-workflow-dialog.test.ts` 通过，合计 3 个测试文件、26 个用例，覆盖了 tags 进度汇总、工作流回填与对话框展示。
    - 边界: 本轮以类型检查 + 定向 Vitest 作为等价验证，尚未补真实浏览器下从后台编辑页触发翻译工作流到标签进度卡片刷新的 E2E 证据；若后续阶段补后台翻译工作流交互回归，可将该场景并入浏览器验证基线。

## 第十九阶段：治理观测与复用基线建设 (已审计归档)

> 审计结论: 第十九阶段围绕 Skills 可见性分层、回归日志滚动归档后的检索与对比体验、重复代码与纯函数复用基线，以及 PostgreSQL 数据库流量热点的观测与最小治理，已在代码、测试、规划文档与回归记录中完成闭环，满足归档条件。当前仅剩“继续观察 serverless 无 Redis 时的数据库直写 fallback 命中情况”这一运行期观察项，但尚未形成新的阶段阻塞证据，不再保留为本阶段待办。

### 1. 主线：外部 Skills 引入与内部 Skills 可见性分层治理 (P0)

- [x] **收敛内部 Skills 可见性并建立外部 Skills 准入清单**
    - 验收: 为项目内部维护的 `.github/skills/**/SKILL.md` 建立统一 frontmatter 约定，默认补齐内部技能标识，避免内部技能与外部来源、平台内置技能混入同一发现面。
    - 验收: 为首批外部 skills 建立来源清单、同步地址、更新频率、失效处理与转内部化门槛，至少覆盖当前技术栈强相关候选。
    - 验收: 补齐最小治理校验，至少能发现 frontmatter 结构漂移、`metadata.internal` 不一致、目录名与 `name` 偏差，以及外部 skill 文档说明与事实源不一致的问题。
    - 结果: 已为 `.github/skills/**/SKILL.md` 统一补齐 `metadata.internal: true`，并确认 `.claude/skills` 通过符号链接映射到 `.github/skills`，未引入镜像漂移；同时新增 `.github/external-skills-registry.json` 与 `docs/standards/external-skills-intake.md`，首批纳入 `nuxt`、`vue`、`vue-best-practices`、`vitest`、`vitepress`、`pnpm` 六个外部候选。
    - 验证: `scripts/ai/check-governance.mjs` 已扩展为可校验内部 skill 的 `metadata.internal`、目录名与 `name` 一致性，以及外部 skill 结构化清单与说明文档漂移；`pnpm ai:check`、`pnpm lint:md` 已通过。

### 2. 主线：回归日志滚动归档后的检索与对比体验治理 (P0)

- [x] **建立回归日志索引入口与最近基线对比路径**
    - 验收: 为 `regression-log.md` 与归档日志建立按阶段、主题或时间的统一索引入口，避免近线与历史记录滚动归档后难以检索。
    - 验收: 明确活动日志与归档日志在“当前基线 / 历史基线 / 发版对比”中的职责分工，并提供最小可用的对比路径。
    - 验收: 视复杂度补齐轻量脚本或索引文档，并完成至少一次“主日志 vs 归档日志”的等价对比演示或等价验证。
    - 结果: 已新增 `docs/plan/regression-log-index.md` 作为统一入口，并在活动日志、归档日志与文档站侧栏补齐导航。
    - 验证: 已将 2026-03-20 至 2026-03-21 的 5 条历史记录滚动迁移到 `docs/plan/regression-log-archive.md`，并在索引页记录一次“主日志 vs 归档日志”的等价对比演示。

### 3. 主线：重复代码治理与纯函数复用基线建设 (P1)

- [x] **输出重复片段分组清单并落地首轮纯函数 / 共享类型复用**
    - 验收: 输出重复纯函数、类型守卫、轻量转换器和共享 payload 结构的分组清单，明确“可提取 / 延后 / 保持局部实现”三类结论。
    - 验收: 至少合并一组高频纯函数或共享类型，补齐最小单元测试或等价验证，并执行定向 `lint`、`typecheck` 与受影响模块回归。
    - 验收: 为后续治理补齐最小规范、目录约束或脚本入口，避免重复代码治理再次回到纯人工盘点。
    - 结果: 已形成字符串列表归一化、optional string 归一化、ASCII slug 生成与清洗、URL / base URL 归一化四组首轮收敛结论，并将相关能力沉淀到 `utils/shared/string-list.ts`、`utils/shared/coerce.ts`、`utils/shared/slug.ts` 与 `utils/shared/url.ts`。
    - 验证: 回归日志已补齐定向 Vitest、ESLint 与 typecheck 证据；`docs/standards/development.md` 已同步加入 shared 纯函数复用约束。

### 4. 主线：PostgreSQL 数据库流量消耗专项分析与治理 (P1)

- [x] **先建立数据库流量观测口径，再对热点路径做最小治理**
    - 验收: “流量消耗大”指向数据库出网流量大，并形成最小证据链。
    - 验收: 聚焦 TypeORM 连接与日志、设置读取高频查库、定时任务扫描与高频写入路径，输出热点路径与是否构成当前阶段阻塞的判定。
    - 验收: 仅对已形成证据链的热点做最小优化或缓解，不将本阶段扩写为整仓数据库重构工程；并补齐受影响路径的最小验证或回归记录。
    - 结果: 已将公开设置链路的整表读取与 localized 双批读取收敛到按 key 批量取数，移除页面装配期重复 `fetchSiteConfig()`，并将定时任务扫描缩减为最小字段集。
    - 验证: `docs/plan/regression-log.md` 已记录定向测试、浏览器 Network 检查与本地 PostgreSQL 采样证据，确认 `/api/settings/public` 与定时任务扫描的查询面均已收敛。

## 第二十阶段：质量门禁、发布自动化与安全治理闭环建设 (已审计归档)

> 审计结论: 第二十阶段围绕浏览器 / E2E 稳定性、发布前校验与 Review Gate 自动化、安全告警闭环，以及重复代码检测脚本化基线的四条主线，已在脚本、测试、规划文档与回归记录中完成闭环，满足归档条件。当前仅剩“重复代码首批立即处理候选尚未进入第二轮抽象落地”这一后续治理观察项，但不影响本阶段归档；下一阶段规划已转入 `roadmap.md` 与 `todo.md`，不再保留本阶段正文。

> **ROI 评估**: 浏览器与 E2E 稳定性治理 2.00；Release 与 Review Gate 自动化整合 1.83；Dependabot / Code Scanning 安全告警闭环 1.83；重复代码检测自动化补强 1.60。四项均满足本阶段准入条件。

### 1. 主线：浏览器与 E2E 稳定性治理 (P0)

- [x] **测试服务稳定性与关键链路收敛**
    - 验收: 明确并修复当前 Playwright 运行中测试服务中途失联、`Connection refused`、关键接口高并发触发 429 或等价问题的主要根因。
    - 验收: 至少为认证会话、后台受保护页访问、文章编辑器核心路径建立可复用的稳定验证口径，而不是依赖一次性人工补跑。
    - 结果: 已将过期 `.output` 构建复用、认证测试模式、受保护路由跳转接管与关键矩阵命令收敛到 `scripts/testing/run-e2e.mjs`、`scripts/testing/run-e2e-critical.mjs` 与对应 Playwright 用例中。
    - 验证: `docs/plan/regression-log.md` 已记录 `pnpm test:e2e:critical` 20 passed 与全量 `pnpm test:e2e` 185 passed / 66 skipped 的收口结果，确认最小关键路径与全量套件均已回到稳定态。
- [x] **最小关键路径浏览器基线固化**
    - 验收: 收敛 Chromium / Firefox / WebKit 与最小移动端 smoke 的执行范围、触发条件与失败归因规则。
    - 验收: 将“哪些改动必须补浏览器证据”写入回归记录或脚本入口说明，避免后续继续凭经验补跑。
    - 结果: 已把认证会话三浏览器矩阵与移动端关键 smoke 固化为正式入口，并把升级到全量 Playwright 的条件写入回归记录。
    - 验证: `docs/plan/regression-log.md` 已沉淀两轮浏览器主线回归与收口补充，可直接作为后续阶段比较基线。

### 2. 主线：Release 与 Review Gate 自动化整合 (P0)

- [x] **发布链路统一编排**
    - 验收: 在现有 `lint`、`typecheck`、`security:audit-deps`、文档检查与 Review Gate 基础上，补齐统一的发布前校验入口或等价脚本编排。
    - 验收: 明确发布、阶段归档与高风险改动收口时的最低验证矩阵，避免继续依赖分散的人肉命令顺序。
    - 实现: `scripts/release/pre-release-check.mjs` + `pnpm release:check` / `pnpm release:check:full`
- [x] **Review Gate 证据自动化补强**
    - 验收: 为常见治理型改动补齐可复用的证据模板、结果落点或脚本辅助，至少覆盖质量门状态、已执行验证、问题分级与未覆盖边界。
    - 验收: 相关收口流程需与 `regression-log.md`、`planning.md`、`documentation.md` 的现有规范保持一致，不新增第二套口径。
    - 实现: `scripts/review-gate/generate-evidence.mjs` + `pnpm review-gate:generate` / `pnpm review-gate:generate:check`
    - 验证: 阶段收口补跑结果已补充到 `docs/plan/regression-log.md` 的 2026-04-01 记录，可直接复用于后续阶段归档与发布前校验。

### 3. 主线：Dependabot / Code Scanning 安全告警闭环 (P0)

- [x] **Security 数据源接入与分类落点**
    - 验收: 评估并优先接入仓库 Dependabot alerts 与 Code Scanning alerts 的官方数据来源；若工具链受限，明确回退路径与证据口径。
    - 验收: 形成“可立即修复 / 需延期 / 仅观察”的分级规则，并与现有 release 安全门禁保持一致。
    - 实现: `scripts/security/check-github-security-alerts.mjs` + `pnpm security:alerts` + `.github/security/security-alert-exceptions.json`
- [x] **修复与延期治理闭环**
    - 验收: 至少完成一轮真实告警的修复、验证、延期记录或 allowlist / 例外基线收敛，避免只做读取不做处置判断。
    - 验收: 将结果同步沉淀到回归记录与 Review Gate 结论中，确保后续发版前可直接复用。
    - 实现: `scripts/security/load-local-env.mjs` + `pnpm.overrides[@xmldom/xmldom]` + `pnpm security:audit-deps` / `pnpm security:alerts`
    - 验证: 已通过本地 `.env` 自动装载完成安全门禁补跑，修复 `@xmldom/xmldom` high 告警并生成 `artifacts/review-gate/2026-04-01-security-alerts.json` / `.md`；详见 `docs/plan/regression-log.md` 2026-04-01 真实告警修复闭环记录。

### 4. 主线：重复代码检测自动化补强 (P1)

- [x] **重复代码检测脚本 / 工具落库**
    - 验收: 为重复代码治理补齐正式脚本入口或等价工具接入，优先支持 stable report 输出，而不是继续停留在纯人工检索。
    - 验收: 明确扫描范围、忽略目录、报告产物位置与 baseline / warn 策略，避免首轮就把治理扩写成全仓阻断式重构。
    - 实现: `.jscpd.json` + `scripts/review-gate/check-duplicate-code.mjs` + `pnpm duplicate-code:check` / `pnpm duplicate-code:check:strict` + `.github/review-gate/duplicate-code-baseline.json`
- [x] **检测结果与 shared 复用治理联动**
    - 验收: 首轮至少输出一份可追溯的重复片段检测报告，并结合 shared helper / 纯函数治理基线给出“立即处理 / 延后处理 / 保持局部实现”分类。
    - 验收: 将重复代码检测结果纳入回归记录、Review Gate 或质量门说明，形成持续可复用的治理入口。
    - 验证: 已生成 `artifacts/review-gate/2026-04-01-duplicate-code.json` / `.md`，并将首轮分类、baseline 与 strict 回归结果同步到 `docs/plan/regression-log.md` 的 2026-04-01 记录。

## 第二十一阶段：验证入口与创作工作流体验收敛 (已审计归档)

> 审计结论: 第二十一阶段围绕 UI 真实环境测试流程治理、脚本专项优化与执行入口治理、测试覆盖率阶段性抬升、RSS 外部动态挂载、标签翻译前置化与默认封面可读性优化六条主线，已在脚本入口、实现代码、测试、回归记录与规划文档中完成闭环，满足归档条件。当前仅保留“下一阶段如何继续扩面测试有效性、批量翻译编排与规则收紧”的候选分析事项，尚未正式上收为新阶段，不影响本阶段归档。

> **ROI 评估**: UI 真实环境测试流程治理 2.25；脚本专项优化与执行入口治理 1.60；测试覆盖率阶段性抬升治理 2.00；RSS 资源挂载与外部动态聚合展示 1.60；标签翻译前置化与正文翻译解耦优化 1.60；默认封面生成文案压缩与大字号策略优化 1.75。六项均满足本阶段准入条件。

### 1. 主线：UI 真实环境测试流程治理 (P0)

- [x] **沉淀回归优先脚本与真实环境验证分层**
    - 验收: 明确“可复跑脚本作为回归基线、技能只用于探索性验证”的执行边界，并同步到 `scripts/README.md`、`docs/standards/testing.md` 或等价入口文档。
    - 验收: 至少为一条高频 UI 回归场景补齐稳定脚本入口、证据落点与失败归因模板。
    - 结果: 已把 `pnpm test:e2e:review-gate --scope=<change>` 固化为可复跑入口，并将脚本优先、技能补充的分层边界同步到测试规范、开发指南与脚本说明。
    - 验证: `docs/plan/regression-log.md` 已记录 2026-04-01 的 UI 真实环境 Review Gate 证据规范补强回归，覆盖 `manifest.json`、`evidence.md` 与失败归因分类的结构化产物。
- [x] **收敛浏览器环境准备与证据产物规范**
    - 验收: 统一登录态复用、测试数据前置 / 清理、截图 / 日志产物落点与失败命名规范，减少人工验证抖动。
    - 验收: 对应流程需能直接服务 Review Gate，而不是继续依赖口头说明。
    - 结果: Review Gate 运行目录已统一收敛为 `evidence.md`、`manifest.json`、`playwright.log`、`playwright-report/` 与 `test-results/` 的固定结构，并显式记录环境准备边界与 critical 场景矩阵。
    - 验证: `tests/scripts/run-review-gate-ui-baseline.test.ts` 与对应 ESLint / Markdown 检查已在 2026-04-01 回归中通过。

### 2. 主线：脚本专项优化与执行入口治理 (P0)

- [x] **补齐 `scripts/README.md` 与高频入口索引**
    - 验收: 说明常用脚本用途、输入输出、风险边界与废弃标记，避免脚本只能靠记忆使用。
    - 验收: 至少覆盖 release、review-gate、security、testing、docs、i18n 等高频入口。
    - 结果: 已建立脚本入口索引，覆盖 release、review-gate、security、testing、docs 与 i18n 等高频命令面，并统一其风险边界与适用场景说明。
- [x] **收敛重复脚本 helper 与无效入口清理**
    - 验收: 盘点参数解析、日志输出、文件读写、错误处理等重复模式，落地首轮公共 helper 或删除 / 合并结论。
    - 验收: 对拟删除脚本给出保留 / 删除 / 合并依据，并补齐最小回归验证。
    - 结果: 已完成重复 helper 的首轮收敛与无效入口梳理，脚本层高频能力不再依赖零散命令记忆；对应治理结论已收敛到脚本入口说明与现有规范文档。

### 3. 主线：测试覆盖率阶段性抬升治理 (P0)

- [x] **建立覆盖率阶段基线与逐阶段提升机制**
    - 验收: 产出当前核心模块测试覆盖率基线、优先补齐路径与后续阶段每阶段约提升 5% 的治理节奏，目标最终稳定达到 80% 以上。
    - 验收: 明确本阶段允许使用的定向测试、coverage 命令、timeout budget、证据落点与未覆盖边界记录口径，避免覆盖率治理变成无上限全仓补测。
    - 结果: 已在 `docs/standards/testing.md` 与 `docs/plan/regression-log.md` 中形成“60% 守线 + 按目录或模块组逐阶段提升”的治理节奏、命令预算与记录口径。
- [x] **完成本阶段首轮覆盖率补强**
    - 验收: 至少对一组核心路径或低覆盖模块完成测试补强，并使阶段覆盖率相对上一轮基线提升约 5%，或在达到 80% 后转为守线与缺口治理。
    - 验收: 回归记录需沉淀覆盖率结果、失败归因、未覆盖边界与下一阶段继续补齐建议。
    - 结果: 已对 `utils/shared` 与 `utils/web` 的低覆盖模块完成首轮补测，全仓覆盖率从 Statements 60.06% 提升到 60.95%，`utils/web` 目录提升到 Statements 89.41%。
    - 验证: 详见 `docs/plan/regression-log.md` 2026-04-02 测试覆盖率阶段性抬升治理首轮基线记录。

### 4. 主线：RSS 资源挂载与外部动态聚合展示 (P1)

- [x] **建立 RSS / RSSHub 统一接入层与缓存降级边界**
    - 验收: 为 RSS 与 RSSHub 源明确统一拉取、清洗、缓存、来源标识与失败降级口径，不再在页面直接拼接外部返回结果。
    - 验收: 明确抓取频率、缓存时效、可选关闭开关与解析失败回退策略，避免外部源抖动拖垮主站页面稳定性。
    - 结果: 已形成统一的外部动态聚合层、缓存 / 降级边界与来源标识契约，并在首页与后台设置侧复用同一模型，而不是由页面直接拼接外部返回结构。
- [x] **补齐外部动态挂载模型与最小展示入口**
    - 验收: 支持将外部内容以卡片流、时间线或侧栏模块挂载到首页、作者页或独立聚合页中的至少一种正式入口，并明确排序、去重、语言过滤与跳转策略。
    - 验收: 补齐最小验证或等价回归记录，证明挂载模型不会破坏现有页面稳定性与多语言体验。
    - 结果: 首页外部动态展示、后台刷新与聚合器行为已收敛到统一挂载模型，并补齐设计文档与测试入口。
    - 验证: 已由 `pages/index.test.ts`、`components/home/external-feed-panel.test.ts`、`tests/server/external-feed/aggregator.test.ts` 与 `components/admin/settings/third-party-settings.test.ts` 覆盖关键路径。

### 5. 主线：标签翻译前置化与正文翻译解耦优化 (P1)

- [x] **前置标签翻译并补齐进度 / 失败分叉**
    - 验收: 标签翻译可以在正文长流程结束前更早完成，并在单篇翻译工作流中可见。
    - 验收: 覆盖标签先完成、正文处理中、用户取消、标签失败但正文继续等状态分叉，不破坏现有 `translationId` 绑定口径。
    - 结果: 标签翻译已前置到长文本翻译流程更早阶段，并纳入工作流状态机，支持标签先完成、正文继续与失败分叉的可见反馈。
- [x] **对齐 CLI / MCP / 后台编辑器的翻译编排语义**
    - 验收: 三类入口的步骤顺序、进度状态与重试 / 取消语义保持一致，不形成双重事实源。
    - 验收: 为至少一条入口补齐定向测试或等价验证。
    - 结果: 后台编辑器、CLI 与 MCP 已共享同一翻译编排契约，保持 `translationId`、taxonomy 绑定与进度状态语义一致。
    - 验证: 相关实现与测试已在翻译工作流路径中补齐，且中文路线图 / 待办与当前实现口径一致。

### 6. 主线：默认封面生成文案压缩与大字号策略优化 (P1)

- [x] **收敛默认封面文案选择顺序与文本长度策略**
    - 验收: 建立“封面短句 > 关键词摘要 > 短标题 > 截断原始标题”的稳定优先级，避免把整段标题原样塞入封面。
    - 验收: 中英文与长词语言下都能得到可预测的换行、字号与截断结果。
    - 结果: 默认封面文案已收敛为稳定优先级策略，不再直接继承过长原始标题；共享视觉资产模型也同步吸收新的短句与标题压缩逻辑。
- [x] **对齐自动回填与候选图工作流的默认视觉表现**
    - 验收: 自动回填封面与待确认候选图两条链路的默认版式一致，不出现一条链路字号过小、另一条链路仍使用旧策略。
    - 验收: 补齐最小视觉或脚本化验证，确保默认封面在常见标题长度下可读性提升。
    - 结果: 自动回填与候选图待确认两条链路已统一默认版式与大字号表现，避免封面默认视觉继续漂移。
    - 验证: 相关逻辑已在 `utils/shared/ai-visual-asset.ts`、`components/admin/posts/post-editor-media-settings.vue` 与对应测试中收敛。

## 第二十二阶段：质量有效性与创作编排治理深化 (已审计归档)

> 审计结论: 第二十二阶段围绕测试有效性增强、周期性回归任务实盘化、批量翻译编排能力评估、ESLint 规则分阶段收紧、时间配置解析与日期事实源收敛，以及后台文章管理入口前置到顶栏六条主线，已在实现代码、测试 / 验证、回归记录与规划文档中完成闭环，满足归档条件。下一阶段目前仅保留候选分析，不在本次归档中偷跑为正式 Phase 23。

> **ROI 评估**: 测试有效性增强治理 2.00；周期性回归任务实盘化 2.25；文章批量翻译到其他语言的编排能力评估 1.29；ESLint 规则分阶段收紧治理 1.17；时间配置解析与日期事实源收敛 1.75；后台文章管理入口前置到顶栏 2.50。六项均已按本阶段准入边界完成收口。

### 1. 主线：测试有效性增强治理 (P0)

- [x] **建立红绿测试与失败路径优先的首轮治理范围**
    - 验收: 先圈定一组核心模块或高回归风险链路，明确哪些场景需要先写失败用例、再补实现或回归验证，避免把治理扩写成全仓测试重构。
    - 验收: 至少补齐边缘条件、异常输入、失败路径与回退路径中的一组高收益缺口，并给出为什么这些测试比继续堆 coverage 更有约束力的说明。
    - 结果: 已将 `server/utils/post-access.ts` 锁定为首轮治理范围，优先覆盖订阅者状态查询失败、公共列表过滤分支，以及路由层异常映射与密码解锁凭据边界。
- [x] **补齐测试有效性的证据口径**
    - 验收: 在回归记录中明确记录本轮新增失败用例、修复后转绿结果、未覆盖边界与下一轮优先补齐范围。
    - 验收: 不得只把该主线落成“新增若干测试文件”，必须体现对真实缺陷约束力的提升。
    - 结果: 已在 `docs/plan/regression-log.md` 记录失败路径补强、`503` 异常映射与“签名 + 逐项过期”解锁凭据收敛结果。

### 2. 主线：周期性回归任务实盘化 (P0)

- [x] **把既有周期性回归规范上收为可执行节奏**
    - 验收: 明确周级、发版前与阶段收口前三类回归的最小执行清单、责任边界与触发条件，不再只停留在规范文本。
    - 验收: 至少覆盖测试 / coverage、依赖安全、文档同步、脚本入口、性能基线或等价高漂移项中的一组固定组合。
    - 结果: 已新增 `scripts/regression/run-periodic-regression.mjs`，并固定 `pnpm regression:weekly`、`pnpm regression:pre-release`、`pnpm regression:phase-close` 三条入口。
- [x] **统一回归产物与调度记录方式**
    - 验收: 回归结果继续统一沉淀到 `docs/plan/regression-log.md`，并明确何时滚动归档、何时升级为阻塞项。
    - 验收: 不再新增第二套周期性回归记录口径或临时散落文档。
    - 结果: 已统一回归证据到 `artifacts/review-gate/`，并在本次归档中完成 `regression-log.md` 的滚动归档与索引同步。

### 3. 主线：文章批量翻译到其他语言的编排能力评估 (P1)

- [x] **完成批量翻译编排边界评估**
    - 验收: 明确文章范围选择、目标语言矩阵、预览确认、失败重入、人工重试与已存在目标语言草稿时的覆盖策略。
    - 验收: 说明该能力如何复用现有 `translationId`、翻译范围、标签 / 分类映射与任务状态模型，而不是另起旁路实现。
    - 结果: 评估结论与边界已沉淀到 `docs/design/governance/batch-translation-orchestration.md`。
- [x] **输出最小可行方案与风险清单**
    - 验收: 至少产出配额 / 成本预算、并发上限、Serverless 超时预算与取消策略的首轮结论。
    - 验收: 若本阶段不直接进入实现，也必须形成下一步是否准入开发的明确判断。
    - 结果: 已形成“允许进入 MVP，但仅限复用现有单篇翻译工作流并新增批次编排层”的准入判断。

### 4. 主线：ESLint 规则分阶段收紧治理 (P1)

- [x] **建立规则债务基线与首批收紧范围**
    - 验收: 先梳理现有规则豁免、warning 债务与高频误报点，给出首批拟收紧规则与影响目录。
    - 验收: 保留测试、脚本、迁移与历史遗留目录的单独豁免边界，避免治理范围失控。
    - 结果: 已完成 `unbound-method` 与 `no-misused-spread` 的分阶段采样、production / test 债务归因与作用范围判断。
- [x] **完成首批规则收紧与回滚口径说明**
    - 验收: 每一批规则收紧都要明确预期收益、回滚方式、最小验证矩阵与遗留风险。
    - 验收: 不得在没有基线与分批策略前直接大规模提升 warning 或 error 级别。
    - 结果: 已将 `unbound-method` 扩面到全量生产 TS，并把 `no-misused-spread` 提升为排除 `scripts/**` 的全量 TS warning，配套记录回滚口径与最小验证矩阵。

### 5. 主线：时间配置解析与日期事实源收敛 (P1)

- [x] **统一涉及时长配置的解析口径**
    - 验收: 对涉及超时、缓存 TTL、轮询间隔、回退等待等“毫秒型”配置项，优先收敛到 `ms` 包解析，减少手写换算与字符串 / 数值混用。
    - 验收: 明确哪些运行时边界仍保留原生毫秒值输入，哪些配置入口应支持人类可读时长表达。
    - 结果: 已完成时长配置与日期逻辑的首轮统一，并补齐对应定向验证。
- [x] **收敛日期逻辑的事实源**
    - 验收: 业务逻辑中的日期格式化、比较、排序、区间判断优先统一使用 `dayjs`；模板继续遵循 `useI18nDate`，`new Date()` 仅保留在运行时边界与原生 API 入参。
    - 验收: 至少补齐一组“时间配置解析 + 日期逻辑替换”定向验证，证明本轮不是只改规范而不落代码。
    - 结果: 相关治理已在本阶段实现与验证完成，不再作为当前阶段阻塞项保留。

### 6. 主线：后台文章管理入口前置到顶栏 (P1)

- [x] **提升后台文章管理高频入口可达性**
    - 验收: 将文章管理入口前置到顶栏或等价高频导航位置，减少进入文章管理流的点击路径。
    - 验收: 不得因此破坏现有权限可见性、响应式布局与顶栏信息密度平衡。
    - 结果: 已将后台文章管理高频入口前置，并保持角色边界与响应式行为稳定。
- [x] **补齐导航变更的最小回归验证**
    - 验收: 至少覆盖桌面端、窄屏或移动端，以及不同角色下的入口显隐与跳转正确性。
    - 验收: 若顶栏空间不足，必须给出取舍依据，而不是简单堆叠入口。
    - 结果: 已完成桌面 / 窄屏入口显隐与跳转验证，满足本阶段收口要求。


## 第二十三阶段：社交平台与 AI 生成内容优化、安全巡检 (已审计归档)

> 审计结论: 第二十三阶段围绕多语言社交与赞助平台扩展、AI 媒体生成在 Vercel 场景下的超时巡检与状态补偿、依赖包风险每日巡检自动化、实时语音识别鉴权有效期优化，以及文章详情相关文章推荐与内容发现增强五条主线，已在实现代码、定向测试、运行调度入口与规划文档中完成闭环，满足归档条件。关键验证与 Review Gate 详见 [regression-log.md](./regression-log.md) 中 2026-04-07 的阶段收口记录。下一阶段目前仅保留候选分析，不在本次归档中直接上收为正式 Phase 24。

> **ROI 评估**: 多语言社交与赞助平台扩展 1.60；AI 媒体生成在 Vercel 场景下的超时巡检与状态补偿 1.75；依赖包风险每日巡检自动化 1.60；实时语音识别鉴权有效期优化 1.50；文章详情相关文章推荐与内容发现增强 1.50。五项均已按本阶段准入边界完成收口。

### 1. 主线：多语言社交与赞助平台扩展 (P1)

- [x] **补齐中英文高频平台与共享元数据约定**
    - 验收: 在现有社交 / 赞助系统上补齐中英文高频平台，并同步图标、颜色与展示文案约定。
    - 验收: 平台名称、标签与编辑选项覆盖当前已支持语言集合，不在 `zh-TW`、`ko-KR` 等语种下退回硬编码平台名。
    - 结果: 已扩展共享平台注册表与 URL / 图片模式元数据，补齐掘金、小红书、抖音、Stack Overflow、Instagram、LinkedIn、Twitch、Ko-fi、Liberapay 等默认平台，并完成五个 locale 的平台文案补齐。
- [x] **守住作者级 / 全局级回退与 both 模式展示链路**
    - 验收: 不破坏作者级 / 全局级回退、locale 过滤与二维码 / URL 双模式展示链路。
    - 验收: 商业设置编辑器与文章赞助组件需继续复用统一 helper，避免平台配置事实源分叉。
    - 结果: 商业设置编辑器与文章赞助组件已统一复用共享 helper，both 模式平台可同时展示链接与二维码入口，并补齐定向 Vitest 与浏览器快照验证。

### 2. 主线：AI 媒体生成在 Vercel 场景下的超时巡检与状态补偿 (P0)

- [x] **补齐 AI 媒体任务的超时补偿闭环**
    - 验收: 为图像生成与播客音频生成任务补齐超时阈值、失联检测、状态回写补偿与最终失败落点。
    - 验收: 覆盖云函数超时、供应商已完成但站内未同步、轮询链路丢失结果三类失败来源，并验证幂等性。
    - 结果: 已为图像生成与播客任务增加可恢复 checkpoint、补偿次数上限与最终失败落点，并在巡检阶段增加数据库级 compare-and-set 认领与分布式锁双保险。
- [x] **把 AI 媒体巡检接入统一调度入口**
    - 验收: 增加定时扫描或等价机制，主动处理长时间无心跳 / 无结果回写的任务。
    - 验收: 统一输出结构化补偿摘要，便于调度入口与审计记录复用。
    - 结果: 已新增 AI 媒体超时巡检服务并接入常规定时维护入口，相关调度服务与 webhook 返回值已补齐定向 Vitest 覆盖。

### 3. 主线：依赖包风险每日巡检自动化 (P0)

- [x] **新增每日依赖安全巡检入口与结构化摘要**
    - 验收: 复用现有 `security:audit-deps` 与依赖风险检查脚本，增加每天执行一次的自动调度入口。
    - 验收: 产出结构化结果摘要，区分“无高危风险”“发现可修复风险”“审计执行失败”三类结论，并保留近期可追溯记录。
    - 结果: 已新增 `scripts/security/run-daily-dependency-audit.mjs`、`pnpm security:audit-deps:daily` 与 `.github/workflows/dependency-risk-daily.yml`，每日调度默认上传 JSON / Markdown artifact 并保留 30 天。
- [x] **补齐 high+ 风险与执行失败时的最小告警能力**
    - 验收: 当发现 `high` 及以上级别风险或执行失败时，提供最小可用的告警 / 通知能力与降级说明。
    - 验收: GitHub issue 能力不可用时，仍需保留 failed workflow + artifact 的降级告警路径。
    - 结果: 当前已支持 issue 创建 / 更新与 failed workflow + artifact 两级告警回退，并补齐对应脚本测试与脚本说明文档。

### 4. 主线：实时语音识别鉴权有效期优化 (P1)

- [x] **将实时 ASR 鉴权有效期提升到 10 分钟级别**
    - 验收: 将实时语音识别鉴权有效期优化到 10 分钟级别，降低长会话中频繁失效导致的中断与重连成本。
    - 验收: 同步提供可配置 TTL，并限制在 5 分钟到 1 小时之间。
    - 结果: 已新增 `asr_credential_ttl_seconds` / `ASR_CREDENTIAL_TTL_SECONDS` 设置项，服务端默认将实时 ASR 直连鉴权有效期提升到 10 分钟并限制在允许区间内。
- [x] **补齐续期、时钟偏差与过期恢复路径**
    - 验收: 同步评估签名策略、续期方式、前后端时钟偏差与过期后的恢复路径。
    - 验收: 覆盖长会话、续期失败、过期恢复与不同环境下的鉴权一致性验证。
    - 结果: 前端 `use-asr-direct` 已补齐提前续期、时钟偏差缓冲、401 凭证刷新重试，以及流式连接旧 socket 事件隔离与手动 stop 取消在途重连保护，并同步补充定向单测与设计文档说明。

### 5. 主线：文章详情相关文章推荐与内容发现增强 (P1)

- [x] **在文章详情页落地按翻译簇去重的相关文章推荐**
    - 验收: 在文章详情页按分类、标签或 translation cluster 相似度提供相关文章推荐，并避免同一翻译簇重复占位。
    - 验收: 补齐多语言过滤、去重与推荐规则的最小回归测试。
    - 结果: 已在文章详情服务层新增相关文章推荐逻辑，基于分类 / 标签翻译簇计算相似度并按 locale fallback 选择单个代表版本，避免同一文章翻译簇重复占位，并补齐 id / slug 双入口定向回归。
- [x] **控制推荐模块的展示位置与阅读干扰**
    - 验收: 推荐模块以不打断正文阅读的轻量形态落地，不削弱正文主路径可读性。
    - 验收: 推荐链接需附带 `language` 查询参数，避免跨语言 slug 歧义。
    - 结果: 详情页正文后已新增轻量推荐区，推荐区位于标签后、上一篇 / 下一篇导航前，并同步补齐五个 locale 的推荐文案与本地浏览器快照验证。

## 第二十四阶段：质量守线与回归执行深化 (已审计归档)

> 审计结论: 第二十四阶段围绕测试覆盖率与红绿测试有效性深化、ESLint / 类型债分批收紧、重复代码与纯函数复用收敛，以及阶段级回归任务执行与收口证据链复盘四条主线，已在实现代码、定向测试、规划文档与阶段收口 artifact 中完成闭环，满足归档条件。正式放行依据为 [2026-04-08-phase-close-regression.md](./../../artifacts/review-gate/2026-04-08-phase-close-regression.md) 的 `Pass` 结论；`docs:check:source-of-truth` 中英文翻译时效告警仍按当前 pre-release 非阻断 warning 口径留作后续治理，不影响本阶段归档。

> **ROI 评估**: 测试覆盖率与红绿测试有效性治理 2.00；ESLint / 类型债分批收紧 1.50；重复代码与纯函数复用收敛 1.40；阶段级回归任务执行与证据链复盘 2.00。四项均已按本阶段准入边界完成收口，其中阶段级回归任务执行与证据链复盘已在收口复跑中转绿。

### 1. 主线：测试覆盖率与红绿测试有效性深化 (P0)

- [x] **在当前覆盖率基线上继续提升并越过阶段守线**
    - 验收: 在当前覆盖率基线上继续提升至少 5%，阶段目标先达到约 68%，并记录新增覆盖率、模块分布与未覆盖边界。
    - 验收: 至少围绕一组高回归风险模块补齐失败路径、边界断言与回退逻辑验证，不接受只堆成功路径测试。
    - 结果: 已完成高 ROI 补强并把全仓语句覆盖率推进到 `68.85%`；AI 服务、语音链路与迁移治理 helper 的失败路径、边界断言与回退逻辑均已形成定向证据。

### 2. 主线：ESLint / 类型债分批收紧 (P1)

- [x] **按小切片完成首轮规则债收紧**
    - 验收: 本阶段只上收 1 - 2 组收益最高、回滚边界清晰的规则族，不做一次性全仓强收紧。
    - 验收: 为每批规则提升补齐 warning / 豁免基线、收益说明、回滚方式与最小验证矩阵。
    - 结果: 已完成 `@typescript-eslint/no-dynamic-delete` 首轮生产代码收紧，并保留 warning 基线、回滚方式与最小验证矩阵，未扩大成失控返工。

### 3. 主线：重复代码与纯函数复用收敛 (P1)

- [x] **完成两轮小范围重复代码治理**
    - 验收: 先聚焦重复度最高且近期频繁变更的模块，完成一轮小范围共享 helper / 纯函数抽象治理。
    - 验收: 输出本轮重复代码基线、抽象收益与仍需继续观察的模块，不把本阶段扩写成跨目录大重构。
    - 结果: 已完成两轮小切片治理，重复代码基线收敛到 `35 clones / 897 duplicated lines / 0.81%`，`duplicate-code:check:strict` 继续保持通过。

### 4. 主线：阶段级回归任务执行与收口证据链复盘 (P0)

- [x] **完成真实阶段级回归并形成统一收口证据链**
    - 验收: 完成一次带明确 timeout budget 的阶段级回归任务，而不是只停留在规范层面的固定入口定义。
    - 验收: 至少覆盖 coverage、lint / typecheck、重复代码、文档一致性与 Review Gate 结论，并统一沉淀到 `regression-log.md`。
    - 验收: 若发现 blocker，明确回灌当前阶段待办；若未发现 blocker，也要记录未覆盖边界与下一次补跑条件。
    - 结果: 已完成真实 `phase-close` 执行、活动日志滚动归档、严格性能预算口径修复与收口复跑；[2026-04-08-phase-close-regression.md](./../../artifacts/review-gate/2026-04-08-phase-close-regression.md) 最终给出 `Pass`，正式放行归档。

## 第二十五阶段：部署体验与可持续演进收敛 (已审计归档)

> 审计结论: 第二十五阶段围绕部署体验与初始化收敛、编辑器与正文渲染体验第二轮收口、构建速度与包体性能深化、Cloudflare 运行时兼容研究与止损结论，以及 AI 初始化 / 配置问答助手评估五条主线，已在实现代码、部署 / 设计 / 指南文档、多语言翻译页与专项 Review Gate 证据中形成闭环，满足归档条件。正式放行依据为 [2026-04-11-phase-25-archive.md](./../../artifacts/review-gate/2026-04-11-phase-25-archive.md) 的 `Pass` 结论；其中部署体验收敛、Cloudflare 研究结论、AI 助手评估与编辑器 / 渲染收口分别继续引用 2026-04-09 至 2026-04-10 的专项证据，不再额外起第二套事实源。

> **ROI 评估**: 部署体验与初始化收敛 2.00；编辑器与正文渲染体验第二轮收口 1.80；构建速度与包体性能深化 1.60；AI 初始化 / 配置问答助手评估 1.33；Cloudflare 运行时兼容研究与止损结论 1.14。五项均已按本阶段准入边界完成收口，其中部署体验与编辑器 / 渲染收口为本轮 P0 主线。

### 1. 部署体验与初始化收敛 (P0)

- [x] **最小可运行路径与部署前体检收敛**
    - 验收: 梳理并收敛“首次部署成功启动”的最小路径，明确核心必填项、可延后增强项与常见错误分层，不再让新部署者主要依赖散落文档自行拼接。
    - 验收: 为部署前体检、启动期配置缺失提示或等价机制补齐最小可用能力，至少能显式识别关键环境变量缺失、配置组合冲突或当前平台不支持的运行方式。
    - 验收: 相关实现必须复用现有 README、部署指南、变量映射、安装向导与设置元信息，不新增第二套配置事实源。
    - 结果: 已在 `server/services/installation.ts`、`utils/shared/installation-diagnostics.ts` 与 `components/installation/step-health-check.vue` 收敛部署运行时识别、阻塞项摘要与安装向导首步体检展示，并通过 `utils/shared/installation-doc-links.ts` 继续复用 locale registry 生成文档入口。
    - 验证: `pnpm exec vitest run utils/shared/installation-diagnostics.test.ts utils/shared/installation-doc-links.test.ts components/installation/step-health-check.test.ts server/services/installation.test.ts`、`pnpm exec eslint server/services/installation.ts components/installation/step-health-check.vue components/installation/step-health-check.test.ts utils/shared/installation-diagnostics.ts utils/shared/installation-diagnostics.test.ts utils/shared/installation-doc-links.ts utils/shared/installation-doc-links.test.ts`、`pnpm exec nuxt typecheck`、`pnpm lint:md` 与 `pnpm docs:check:i18n` 通过。
- [x] **初始化反馈与排障入口统一**
    - 验收: 收敛初始化阶段的提示、失败反馈与排障入口，降低“能看到错误但不知道下一步该做什么”的心智负担。
    - 验收: 至少覆盖本地开发、Vercel / Docker、自托管 Node 三类高频部署路径；Cloudflare 运行时仍按平台边界单独提示，不混淆为已支持路径。
    - 验收: 补齐最小验证，至少确认新部署者可根据提示完成核心变量配置、识别不支持的平台路径，并定位初始化失败原因。
    - 结果: 安装向导首步已输出运行时标签、阻塞 / 警告计数、环境变量提示与统一排障入口；Cloudflare 路径继续按不支持的整站运行时单独提示。
    - 验证: 定向测试覆盖 `utils/shared/installation-diagnostics.test.ts`、`utils/shared/installation-doc-links.test.ts`、`components/installation/step-health-check.test.ts` 与 `server/services/installation.test.ts`，共 24 项通过；`pnpm exec nuxt typecheck`、定向 `eslint`、`pnpm lint:md` 与 `pnpm docs:check:i18n` 通过。

### 2. 编辑器与正文渲染体验第二轮收口 (P0)

- [x] **编辑器兼容性与核心创作路径稳定性补强**
    - 验收: 在继续沿用 `mavon-editor` 异步包装接入的前提下，补齐编辑器核心创作链路的兼容性、交互稳定性与高频操作体验收口。
    - 验收: 至少覆盖工具栏、实时预览、图片 / 媒体插入、翻译回填、多语言切换与未保存状态保护等高频路径，不因局部修补引入新的编辑器回退。
    - 验收: 明确本阶段不直接启动整体替换工程，若发现替换需求，只允许沉淀后续门槛与证据，不扩大当前阶段范围。
    - 结果: 已继续沿用 `components/admin/mavon-editor-client.client.vue` 异步包装，并补齐未保存保护快照、媒体插入链路回归、翻译回填 / 新稿语言切换保护，以及移动端编辑器 smoke。
    - 验证: `pnpm exec vitest run components/admin/posts/post-editor-media-settings.test.ts composables/use-post-editor-translation.test.ts components/article-content.test.ts components/table-of-contents.test.ts utils/shared/markdown.test.ts composables/use-post-editor-page.helpers.test.ts composables/use-unsaved-changes-guard.test.ts`、`pnpm exec playwright test tests/e2e/mobile-critical.e2e.test.ts tests/e2e/auth-session-governance.e2e.test.ts --project=chromium --grep "editor interaction|blank new draft|protect entered new draft"`、`pnpm typecheck` 与定向 `eslint` 通过。
- [x] **预览 / 渲染一致性与多语言编辑体验收敛**
    - 验收: 收敛 Markdown 预览、正文最终渲染、翻译编辑回填与多语言版本切换之间的一致性，减少“编辑时正常、展示时错位”的体验偏差。
    - 验收: 至少覆盖代码块、公式、图片、提示容器、长文本翻译回填与目标语言预览 6 类高风险内容。
    - 验收: 补齐最小定向测试或浏览器验证，记录仍未覆盖的边界与后续观察项。
    - 结果: 已在 `utils/shared/markdown.ts` 收敛正文最终渲染清洗策略，并抽离 `utils/shared/markdown-heading.ts` 作为标题 slug 单一事实源。
    - 验证: `components/article-content.vue`、`components/table-of-contents.vue`、`utils/shared/markdown.test.ts`、`components/article-content.test.ts` 与 `components/table-of-contents.test.ts` 已补齐关键场景验证；专项证据见 [2026-04-10-editor-rendering-round2.md](./../../artifacts/review-gate/2026-04-10-editor-rendering-round2.md)。

### 3. 构建速度与包体性能深化 (P1)

- [x] **高收益热点构建性能收敛**
    - 验收: 基于现有 bundle budget 与性能预算结果，锁定 1 - 2 组高收益热点继续优化构建耗时、首屏依赖与大块 vendor 负担。
    - 验收: 热点范围需显式限定，例如编辑器 / Markdown 渲染链、后台高频页面或文档站构建链路，不扩写为全仓性能重构。
    - 验收: 至少输出优化前后对比结果、预算变化与未继续处理的剩余热点。
    - 结果: 已完成首轮热点收敛，聚焦 `sentry.client.config.ts` 启动重块与 reader / onboarding 低频样式入口污染。
    - 验证: `pnpm build`、`pnpm test:perf:budget`、`pnpm test:perf:budget:strict`、`pnpm typecheck`、`pnpm lint:css`、`pnpm lint:md`、`pnpm exec eslint sentry.client.config.ts components/reader-controls.vue composables/use-onboarding.ts`、`pnpm exec vitest run composables/use-onboarding.test.ts composables/use-reader-mode.test.ts` 通过；`keyCss` 由 `61.04KB` 降至 `59.98KB`，Sentry 配置壳从约 `53.65KB gzip` 拆到约 `0.35KB gzip`。
- [x] **性能守线与验证入口复用**
    - 验收: 继续复用 `test:perf:budget`、strict 预算与现有性能报告链路，不另起第二套性能验证体系。
    - 验收: 若本轮涉及包体切分、依赖替换或构建流程调整，必须补齐对应验证与风险说明，避免“体感优化”缺少证据链。
    - 验收: 保留本轮优化收益、未覆盖边界与下轮可继续切片的方向。
    - 结果: 已继续复用 `.lighthouseci/bundle-budget-report.json` 与现有构建产物进行预算复核，并通过临时 Nitro 验证实例补齐运行期证据。
    - 验证: 当前 `maxAsyncChunkJs` 为 `53.09KB / 120KB`、`keyCss` 为 `59.98KB / 70KB`；剩余热点优先关注运行时壳 `DYc0WSYY.js` 与最大业务 chunk `B653ImUS.js`。

### 4. Cloudflare 运行时兼容研究与止损结论 (P1)

- [x] **Cloudflare 运行时阻塞清单与最小样机研究**
    - 验收: 面向 Cloudflare Pages / Workers / D1 路线输出可追溯的阻塞清单，至少覆盖 TypeORM、Node 运行时依赖、数据库契约、文件存储与定时任务差异。
    - 验收: 若存在最小样机路径，需明确它只代表技术可行性研究，不代表当前项目已支持整站 Cloudflare 部署。
    - 验收: 研究产物至少能够支撑“继续推进 / 暂停投入 / 仅保留外围能力接入”三选一的方向结论。
    - 结果: 已新增 [docs/design/governance/cloudflare-runtime-study.md](../design/governance/cloudflare-runtime-study.md)，并把唯一推荐的最小样机路径收敛为“Cloudflare 仅做外围能力与任务触发，应用主体继续运行在 Vercel / Docker / 自托管 Node”。
- [x] **Cloudflare 平台边界说明与止损结论收口**
    - 验收: 若研究结论仍为短期不适合推进，需进一步收敛对外说明、内部设计约束与后续触发条件，避免未来重复投入同类预研却缺少止损结论。
    - 验收: 若研究结论允许继续推进，也必须先定义下一阶段的技术闸门与替代成本，不得在本阶段直接扩写为整站适配开发。
    - 验收: 补齐对应文档或研究说明入口，确保后续规划可直接复用本轮结论。
    - 结果: 已同步更新部署指南、快速开始、设计入口与文档站导航，将当前对外说明统一收敛为“短期暂停整站 Cloudflare 运行时适配，仅保留外围能力接入”。
    - 验证: `pnpm lint:md` 与 `pnpm docs:check:i18n` 已通过；专项证据见 [2026-04-09-cloudflare-runtime-study.md](./../../artifacts/review-gate/2026-04-09-cloudflare-runtime-study.md)。

### 5. AI 初始化 / 配置问答助手评估 (P1)

- [x] **启用式问答助手范围冻结与事实源复用评估**
    - 验收: 评估是否提供面向新部署者的 AI 初始化 / 配置问答助手，并先冻结可回答范围、可写配置范围、权限边界与失败回退策略。
    - 验收: 明确复用现有安装向导、设置元信息、`qa-assistant` 与文档知识源的可行路径，不额外维护第二套知识或配置事实源。
    - 验收: 若评估结论为不立项，也需保留清晰的拒绝理由与后续触发条件，而不是停留在模糊候选状态。
    - 结果: 已基于现有安装向导字段模型、`ENV -> DB -> Default` 设置解释层、`qa-assistant` 只读边界与部署文档知识源，冻结“只读解释型助手”的可回答范围、禁止写入面与事实源复用路径。
    - 验证: `pnpm lint:md` 与 `pnpm docs:check:i18n` 已通过；专项证据见 [2026-04-09-ai-setup-assistant-evaluation.md](./../../artifacts/review-gate/2026-04-09-ai-setup-assistant-evaluation.md)。
- [x] **安全边界与交互原型评估**
    - 验收: 至少澄清 ENV 锁定字段、敏感配置写入保护、越权问题、错误回答回退与用户确认链路等关键安全边界。
    - 验收: 若进入原型阶段，只允许做启用前引导或配置解释类最小交互，不直接承诺全功能站内 AI 助手体验。
    - 验收: 补齐评估结论、风险分级与是否建议进入下一轮正式实现的产品判断。
    - 结果: 评估结论已明确当前阶段只建议推进安装页 / 设置页双入口的最小交互原型，默认不开放 AI 侧写配置；高风险项收敛为“敏感配置泄露”“只读解释误扩为可写代理”“平台边界误判”三类。

## 第二十六阶段：质量治理与数据库流量收敛 (已审计归档)

> 审计结论: 第二十六阶段围绕测试覆盖率推进、ESLint / 类型债第二轮收紧、存量代码注释治理、重复代码与纯函数复用收敛，以及 PostgreSQL 查询与数据库出网流量治理五条主线，已在实现代码、定向测试、回归记录、运行期监控与规划文档中完成闭环，满足归档条件。阶段放行基于 2026-04-13 收口复核结论：全仓覆盖率已达到阶段目标（约 `72%`），且后台监控显示 PostgreSQL 查询与连接压力已显著缓解。

> **ROI 评估**: 测试覆盖率与红绿测试有效性推进 2.00；ESLint / 类型债第二轮收紧 1.50；存量代码注释治理首轮落地 1.33；重复代码与纯函数复用继续收敛 1.40；PostgreSQL 查询与数据库出网流量治理 1.80。五项均已按本阶段准入边界完成收口。

### 1. 测试覆盖率与红绿测试有效性推进 (P0)

- [x] **把全仓测试覆盖率从 `68.85%` 继续提升到约 `72%`**
    - 验收: 基于当前 coverage 基线继续提升约 `4%`，并在阶段收口时保留新增覆盖率、模块分布与未覆盖边界。
    - 验收: 优先补齐 `server/services/ai/text.ts`、公开查询热点 API 与数据库治理相关服务层的失败路径、边界断言与回退逻辑，而不是平均铺开式补量。
    - 结果: 已完成 `TextService` 首轮增量补测及多批高 ROI 测试补强；结合最新全仓覆盖率结果，阶段目标“约 `72%`”已达成。

### 2. ESLint / 类型债第二轮收紧 (P1)

- [x] **至少再正式收紧 `1 - 2` 条高 ROI ESLint 规则**
    - 验收: 优先选择命中范围有限、回滚边界清晰、对生产代码收益明确的规则族，不直接扩写到 `no-unsafe-*` 或全仓 `any` 清零工程。
    - 结果: 已完成 `@typescript-eslint/no-unnecessary-type-assertion` 与 `@typescript-eslint/no-unnecessary-type-arguments` 两条规则的分批收紧，配套命中清单、回滚边界与最小验证矩阵已落盘。

### 3. 存量代码注释治理首轮落地 (P1)

- [x] **在 `1 - 2` 组高复杂度模块中补齐高价值注释**
    - 验收: 新增注释解释约束、契约、边界、副作用与回退原因，不做逐行复述。
    - 结果: 已完成 locale、配额治理、公开查询裁剪 / 缓存与上传链路等高复杂度模块注释补强，并通过定向测试验证。

### 4. 重复代码与纯函数复用继续收敛 (P1)

- [x] **至少完成 `1` 组公共页模板或查询 helper / 纯函数收敛**
    - 验收: 至少完成一组可复用抽象，不把治理扩大为跨目录重构。
    - 结果: 已提取 `useTaxonomyPostPage` 并收敛 `PostListData` 共享类型，消除 categories / tags 页面与多页面列表数据结构重复实现。

### 5. PostgreSQL 查询与数据库出网流量治理 (P0)

- [x] **优先降低 PostgreSQL 数据库出网流量与查询压力**
    - 验收: 形成 `posts / archive / categories / tags / search / external posts` 热点清单，并完成最小字段集与短 TTL 缓存收敛。
    - 验收: 基于运行期监控补齐“查询与连接压力已显著缓解”的阶段证据。
    - 结果: 已完成热点读链路收敛、初始化边界与匿名鉴权触发面收口；结合后台监控数据，PostgreSQL 查询与连接压力显著下降，主线关闭。

## 第二十七阶段：渠道稳定性与体验性能推进 (已审计归档)

> 审计结论: 第二十七阶段围绕渠道分发回归加固、文章页分享与图标系统收口、接口缓存复用扩面、首屏性能阶段一优化与 E2E 覆盖矩阵第一轮五条主线，已在实现代码、定向测试、回归记录、性能基线与规划文档中完成闭环，满足归档条件。WechatSync 微博 / 小红书链路、RSS 防回归、分享入口与图标映射、性能口径与 E2E 基线均已收口，阶段正式归档。

### 1. 主线：渠道分发回归加固（含 RSS 防回归补测） (P0)

- [x] **收敛 WechatSync 在微博 / 小红书平台的同步回归问题，并补齐 RSS 防回归测试**
    - 验收: WechatSync 在微博 / 小红书链路完成根因收敛与修复，不破坏既有成功平台。
    - 验收: 已确认修复的 RSS 路由补齐定向测试（taxonomy 排序 / feed 路由 / 发现链路），避免同类问题再次出现。
    - 验收: 至少保留一轮定向测试与联调证据。
    - 结果: 已完成微博 / 小红书分发回归收口，WechatSync 运行时桥接与共享分发模板已按实际兼容边界回写；RSS 防回归补测覆盖 taxonomy 排序、feed 路由默认 XML / Atom / JSON 输出与分类页 / 标签页发现链路。
    - 验证: `pnpm exec eslint server/utils/feed.test.ts server/utils/feed-taxonomy-route.test.ts tests/pages/taxonomy-rss-discovery.test.ts` 与 `pnpm exec vitest run server/utils/feed.test.ts server/utils/feed-taxonomy-route.test.ts tests/pages/taxonomy-rss-discovery.test.ts` 通过。

### 2. 主线：文章页一键分享与图标系统修复 (P1)

- [x] **文章页分享入口能力与图标库映射统一打包推进**
    - 验收: 文章页提供统一分享入口，覆盖主流平台并保证移动端可用。
    - 验收: 社交 / 打赏图标映射统一，新增第三方图标库与 fallback 策略。
    - 结果: 已完成文章页分享卡片、分享弹窗与平台图标映射收口，移动端原生分享、桌面端分享面板、主流平台拼链与国内平台复制式分享均已落地；微博在当前阶段统一按复制式分享处理。
    - 设计入口: 分享系统设计草案见 [post-sharing.md](../design/governance/post-sharing.md)。

### 3. 主线：接口缓存逻辑复用与可缓存接口扩面切片 (P1) (已完成)

- [x] **抽离缓存复用层并对高收益公开读接口完成至少一组扩面验证**
    - 验收: 抽离缓存复用层（TTL / 失效 / 键策略 / 权限边界），减少重复实现。
    - 验收: 输出一组高收益接口扩面清单并完成至少 1 组落地验证。
    - 结果: 已统一接入 `settings/public`、`friend-links/index`、`posts/archive`、`categories/index`、`tags/index`，并补齐缓存清单与回归证据，见 [cacheable-api-inventory.md](../design/governance/cacheable-api-inventory.md) 与 [regression-log.md](./regression-log.md)。

### 4. 主线：首屏性能阶段一优化（Lighthouse >= 50） (P0)

- [x] **聚焦关键页面性能瓶颈并建立统一采样口径**
    - 验收: 建立当前瓶颈分解与采样口径，核心页面性能评分稳定达到 >= 50。
    - 验收: 沉淀“措施 - 收益 - 副作用”记录，作为后续冲刺 >= 90 的基线。
    - 结果: 已完成公共壳、文章卡片与编辑器依赖拆分后的基线复核，当前性能预算口径已调整为“非 vendor 异步页面 chunk”；`pnpm build` 与 `pnpm test:perf:budget` 通过，当前预算结果为 `coreEntryJs 139.65KB / 260KB`、`maxAsyncChunkJs 0KB / 120KB`、`keyCss 11.36KB / 70KB`。

### 5. 主线：E2E 覆盖矩阵第一轮 (P1)

- [x] **建立页面与接口覆盖矩阵并补齐首轮稳定基线**
    - 验收: 建立页面与接口覆盖矩阵并明确优先级。
    - 验收: 完成关键交易路径与高风险接口的首轮稳定用例。
    - 结果: 已补齐注册校验、投稿表单失败 / 成功提交流程、`/feedback` 与 `/friend-links` 等公共页 reachability，以及后台 `users`、`comments`、`submissions`、`subscribers`、`friend-links`、`external-links`、`notifications`、`ai`、taxonomy 搜索 / 聚合开关等首轮稳定用例。
    - 证据: 定向命令 `pnpm exec playwright test tests/e2e/submit.e2e.test.ts tests/e2e/user-workflow.e2e.test.ts tests/e2e/admin.e2e.test.ts tests/e2e/public-pages.e2e.test.ts --project=chromium` 已验证 `33 passed / 3 skipped`，详见 [e2e-coverage-matrix.md](../design/governance/e2e-coverage-matrix.md) 与 [regression-log.md](./regression-log.md)。

## 第二十八阶段：内容运营洞察与运行时治理推进 (已审计归档)

> 审计结论: 第二十八阶段围绕后台内容洞察看板、Postgres 查询 / CPU / 连接生命周期平衡治理、coverage `> 76%`、国际化运行时加载与文案复用治理，以及编辑器 Markdown / 外观一致性增强五条主线，已在实现代码、定向测试、活动回归窗口与规划文档中完成闭环，满足归档条件。后台内容洞察首页、数据库预热 / 可选会话解析 / 短 TTL 缓存、i18n 运行时加载治理与编辑器包装层增强均已落地；结合最新全仓 coverage 收口结果与后台运行期数据，Postgres 与 coverage 两条 P0 主线也已满足关闭条件。

### 1. 主线：后台内容统计与热点分析看板 (P1)

- [x] **在后台管理侧交付内容运营洞察首页**
    - 验收: 提供阅读量、评论量、发文量与最近 `7 / 30 / 90` 天趋势，且阅读 / 评论按真实事件趋势呈现。
    - 验收: 提供热门文章、热门标签、热门分类排行，并支持时间范围、语言与公开状态筛选。
    - 验收: 第一轮实现明确翻译簇去重、时区、空数据与草稿过滤口径，不膨胀为通用 BI 系统。
    - 结果: 已将 `/admin` 切换为内容洞察首页，落地 `GET /api/admin/content-insights`、`post_view_hourly` 小时级阅读聚合、`pvCache` 小时桶写入、按请求时区折叠的真实阅读 / 评论趋势，以及热门文章 / 标签 / 分类排行。
    - 验证: `server/api/admin/content-insights.get.test.ts`、`server/utils/admin-content-insights.test.ts` 与 `composables/use-admin-content-insights-page.test.ts` 已覆盖时间聚合、排行稳定性与筛选交互。

### 2. 主线：Postgres 查询、CPU 与连接生命周期平衡治理 (P0)

- [x] **收紧数据库预热范围并完成公开热点读路径继续瘦身**
    - 验收: 收紧会唤醒数据库的请求范围，减少匿名公开流量、安装检查与鉴权链路带来的不必要数据库预热。
    - 验收: 对必须查库的热点读路径继续压缩字段集、重复读取与短 TTL 缓存边界，兼顾查询体量、CPU 使用与连接活跃时长。
    - 验收: 使用 `pg_stat_statements` 或等价 live sample 记录本轮运行期证据，至少能说明查询次数、结果集体量或连接活跃窗口的下降趋势。
    - 结果: 已在 `0b-db-ready` 中间件收紧数据库预热边界，在 `1-auth` 中间件收紧匿名公开链路会话解析触发面，并为 `settings/public`、`friend-links` 等公开读路径补齐短 TTL 运行时缓存；结合后台最新运行期观测，查询次数、重复读取与连接活跃窗口下降趋势已可支撑主线关闭。
    - 验证: `tests/server/middleware/db-ready.test.ts`、`tests/server/middleware/auth-optional-session.test.ts` 与 `tests/server/api/settings/public.get.test.ts` 已覆盖预热边界、可选会话解析与缓存命中契约；运行期背景基线与热点清单继续见 [postgres-hot-read-governance-2026-04-12.md](../../artifacts/postgres-hot-read-governance-2026-04-12.md) 与 [current.md](../reports/regression/current.md)。

### 3. 主线：测试覆盖率与有效性治理（目标 > 76%） (P0)

- [x] **将全项目 coverage 推进到 `76%+` 并保持高风险路径优先补强**
    - 验收: 全项目 coverage 提升到 `76%` 以上，并记录本轮新增覆盖率、模块分布与未覆盖边界。
    - 验收: 优先补齐后台统计、数据库中间件边界、公开读接口、编辑器关键工作流与多语言回退链路的高风险测试，而不是平均铺量。
    - 验收: 新增测试继续覆盖失败路径、边界断言与回退逻辑，不接受只刷 happy path 的低价值用例。
    - 结果: 已补齐后台内容洞察、数据库预热 / 可选会话解析、公开设置短 TTL 缓存、编辑器语音回退与 i18n 运行时加载相关高风险测试；最新全仓 coverage 已超过 `76%` 目标线，本轮 coverage 主线关闭。
    - 验证: 以 2026-04-19 最新全仓 coverage 收口结果为阶段关闭依据；本轮新增高收益测试覆盖 `db-ready`、`auth-optional-session`、`settings/public`、`use-post-editor-voice` 与内容洞察相关关键路径。

### 4. 主线：国际化运行时加载与文案复用治理 (P1)

- [x] **收敛 locale 模块注册、运行时命中与共享文案归属规则**
    - 验收: 审计 locale 模块注册、路由动态加载与运行时命中链路，降低 raw key 直出和跨页面复用后命名空间漂移风险。
    - 验收: 为后台 / 公共页高频共享组件建立页面私有、模块共享、全局共享三层文案归属规则，谨慎推进文案复用。
    - 验收: 将 `lint:i18n` 与定向运行时验证组合成固定补跑入口，并至少补 1 轮高频页面回归验证。
    - 结果: 已补 `use-locale-message-modules`、`pnpm i18n:verify:runtime`、`pnpm i18n:audit:duplicates`，并生成跨语言 cross-module 重复文案候选报告用于后续逐条收敛。

### 5. 主线：编辑器 Markdown 与外观一致性增强 (P1)

- [x] **在现有 `mavon-editor` 包装层内完成主题与 Markdown 能力对齐增强**
    - 验收: 在现有 `mavon-editor` 包装层上补齐工具栏、背景栏与主题变量接入，提升与后台及站点主题的一致性。
    - 验收: 梳理并补齐编辑器 Markdown 能力与文章页渲染能力的对齐范围，优先覆盖高频语法与扩展项，而不是直接替换底层编辑器。
    - 验收: 补齐至少 1 轮定向交互测试或视觉验证，确认不影响自动保存、上传回填与翻译工作流。
    - 结果: 已保留 `mavon-editor` 并在包装层注入 shared renderer，统一工具栏矩阵、主题变量、代码组 tabs / copy 行为与只读模式增强；`markdown`、`admin-markdown-editor`、`rendered-markdown` 相关测试与后台编辑器 smoke 均已收口。

## 第二十九阶段：评论翻译与治理事实源收敛推进 (已审计归档)

> 审计结论: 第二十九阶段围绕评论区翻译、GEO / SEO / AI crawler 可见性补强、ESLint / 类型债窄边界收紧、重复代码与纯函数复用收敛、国际化第二轮治理，以及文档事实源 / 回归记录 / 深度归档治理六条主线，已在实现代码、定向测试、活动回归窗口、设计文档与专项验证记录中完成闭环，满足归档条件。评论区翻译已完成只读切换、缓存复用与匿名阅读兼容；GEO / SEO 抽样验证见 [geo-seo-ai-crawler-validation-2026-04-20.md](../../artifacts/geo-seo-ai-crawler-validation-2026-04-20.md)；其余治理切片分别在 [current.md](../reports/regression/current.md) 的 2026-04-21 近线记录与 [2026-04-18-to-2026-04-21.md](../reports/regression/archive/2026-04-18-to-2026-04-21.md) 归档记录中收口并给出 Review Gate `Pass` 结论。

> **ROI 评估**: 评论区翻译功能 1.67；GEO / SEO / AI crawler 可见性与文章可引用性补强 1.80；ESLint / 类型债与规则收紧治理 1.50；重复代码与纯函数复用收敛 1.60；国际化运行时加载 / 文案复用 / unused 审计治理 1.50；文档事实源、回归记录与深度归档治理 1.40。六项均已按本阶段准入边界完成收口，其中评论区翻译、GEO / SEO 与重复代码复用为本轮优先上收项。

### 1. 主线：评论区翻译功能 (P1)

- [x] **在评论列表与评论详情区交付只读翻译切换**
    - 验收: 在评论列表与评论详情 / 展开区提供“查看翻译 / 查看原文”的只读切换。
    - 验收: 当前语言版本评论优先展示；同一翻译簇中的其他公开语言版本按线程补位，避免语言切换后评论区出现空白错觉。
    - 验收: 跨语言补位评论需标记原始语言；若已命中当前阅读语言缓存，则默认显示译文并保留“查看原文”入口。
    - 验收: 不改写原文，不破坏评论审核、回复链路与现有匿名阅读体验。
    - 验收: 若调用 AI 翻译能力，必须沿用现有配额、频率限制与审计口径，并提供失败兜底与缓存复用。
    - 结果: 已落地评论翻译服务、评论缓存字段与前端只读切换 UI；当前语言评论优先展示，跨语言补位保留原始语言标记，匿名阅读、评论审核与回复链路不受影响。
    - 验证: `components/comment-item.test.ts`、`server/services/comment-translation.test.ts`、`server/api/ai/comment-translation.post.test.ts` 与 `server/services/comment.test.ts` 已覆盖按钮切换、缓存复用、失败兜底与作者隐私链路；模块设计见 [interactions.md](../design/modules/interactions.md)。

### 2. 主线：GEO / SEO / AI crawler 可见性与文章可引用性补强 (P0)

- [x] **补齐公开入口校验与文章可引用性抽样**
    - 验收: 公开 `feed`、`robots`、`sitemap`、`llms` 相关入口具备可复验的状态码与内容校验。
    - 验收: 首页、文章页、分类页的 `canonical`、OG、Twitter、JSON-LD 抽样验证通过。
    - 验收: 至少抽样 `3 - 5` 篇文章验证摘要 / 要点 / FAQ 或等价可引用性增强，不破坏现有渲染与国际化体验。
    - 结果: 已完成 `/robots.txt`、`/feed.atom`、`/sitemap.xml`、`/llms.txt` 与 `/llms-full.txt` 的公开入口抽样，并确认首页、文章页、分类页的 canonical / OG / JSON-LD 对齐；5 篇文章样本均具备摘要块与 `BlogPosting.abstract`。
    - 验证: 专项验证记录见 [geo-seo-ai-crawler-validation-2026-04-20.md](../../artifacts/geo-seo-ai-crawler-validation-2026-04-20.md)；相关运行时能力继续由 `server/utils/llms.ts`、`server/routes/robots.txt.ts`、`server/api/_sitemap-urls.ts` 与页面级 SEO 测试守线。

### 3. 主线：ESLint / 类型债与规则收紧治理 (P1)

- [x] **按窄边界完成两轮规则上收与回滚边界固化**
    - 验收: 只上收 `1 - 2` 条命中有限、回滚边界清晰的高 ROI 规则，不扩写为全仓规则重构。
    - 验收: 输出命中清单、回滚边界与最小验证矩阵，并同步处理受影响文件的 warning / 类型债。
    - 结果: 已完成 `packages/mcp-server` 范围的 `no-explicit-any` / `explicit-module-boundary-types` 收紧，以及 settings API 范围的 `no-unnecessary-type-conversion` 收紧，均保留了命中清单、回滚边界与最小验证矩阵。
    - 验证: 详细记录见 [current.md](../reports/regression/current.md) 的 2026-04-21 近线记录与 [2026-04-18-to-2026-04-21.md](../reports/regression/archive/2026-04-18-to-2026-04-21.md) 的 2026-04-20 / 2026-04-21 归档条目；两轮 Review Gate 结论均为 `Pass`。

### 4. 主线：重复代码与纯函数复用收敛 (P1)

- [x] **完成共享 CSV 列表解析与高收益重复区收敛**
    - 验收: 优先收敛公共页模板片段、列表型查询 helper、查询参数处理或读模型组装中的高收益重复区。
    - 验收: 记录重复基线变化、抽象收益与未覆盖边界，并确认未引入过度泛化。
    - 结果: 已将多处 CSV 列表解析统一回收到 `splitAndNormalizeStringList`，并继续压降前台公共页与查询处理重复区；本轮保持“先复用、后扩面”的窄边界治理策略。
    - 验证: 详细记录见 [2026-04-18-to-2026-04-21.md](../reports/regression/archive/2026-04-18-to-2026-04-21.md) 的 2026-04-20“共享复用层 CSV 列表解析收敛”条目，Review Gate 结论为 `Pass`。

### 5. 主线：国际化运行时加载、文案复用与 unused 审计治理 (P1)

- [x] **明确 missing blocker 分级并补一轮 duplicate / unused 治理基线**
    - 验收: 在现有运行时治理基础上，补一轮 unused 字段排查与 missing blocker 分级治理。
    - 验收: 明确哪些入口必须把 `i18n:audit:missing` 视为 blocker，并沉淀 i18n 变更后的最小检查矩阵。
    - 验收: 继续减少 raw key 直出、命名空间漂移与不受控的跨页面文案复用。
    - 结果: 已补齐 `admin-posts` 缺词 parity，明确 `release`、`weekly` 与 `phase-close` 对 `i18n:audit:missing` 的 blocker 口径，并完成一轮 cross-module duplicate 抽取与 unused 分级说明。
    - 验证: 详细记录见 [2026-04-18-to-2026-04-21.md](../reports/regression/archive/2026-04-18-to-2026-04-21.md) 的 2026-04-18“admin-posts parity 与缺词门禁上收”与“i18n 重复文案抽取”条目。

### 6. 主线：文档事实源、回归记录与深度归档治理 (P1)

- [x] **完成目录分层、回归入口与深度归档阈值的首轮收敛**
    - 验收: 至少完成一轮模块设计文档、专项治理目录、回归记录入口与深度归档阈值的组合收敛。
    - 验收: 明确活动窗口、历史归档与兼容入口的边界，并沉淀后续拆分策略。
    - 验收: `docs/design/modules/` 只保留模块总设计，专项治理 / 增量设计 / 阶段复盘统一迁移到 `docs/design/governance/`。
    - 结果: 已完成 `docs/design/modules/` 与 `docs/design/governance/` 的职责分层、`docs/reports/regression/**` 的正式入口收敛，以及 `roadmap.md` / `todo-archive.md` 的 warning / 强制分片阈值文档化。
    - 验证: 详细记录见 [2026-04-18-to-2026-04-21.md](../reports/regression/archive/2026-04-18-to-2026-04-21.md) 的 2026-04-20“文档事实源、回归入口与深度归档阈值收敛”条目，Review Gate 结论为 `Pass`。

## 第三十阶段：远程仓库同步与治理基线细化推进（Hexo 风格导出） (已审计归档)

> 审计结论: 第三十阶段围绕远程仓库同步（Hexo 风格 / GitHub / Gitee）候选落地、文档翻译 freshness 清偿、国际化字段治理、重复代码与纯函数复用治理、存量代码注释治理，以及 ESLint / 类型债与规则收紧治理六条主线，已在实现代码、专项设计文档、活动回归窗口、Guide / Standards 文档与定向测试中完成闭环，满足归档条件。远程仓库同步已完成 GitHub / Gitee provider 契约评估与单篇文章手动推送最小闭环；其余五条治理主线均已在 [current.md](../reports/regression/current.md) 的 2026-04-21 记录中给出 Review Gate `Pass` 结论。

> **ROI 评估**: 远程仓库同步（Hexo 风格 / GitHub / Gitee）能力评估与候选落地 1.60；文档翻译 freshness 清偿与文档翻译治理 1.60；国际化字段治理 1.60；重复代码与纯函数复用治理 1.60；存量代码注释治理与注释漂移治理 1.40；ESLint / 类型债与规则收紧治理 1.50。六项均已按当前阶段的执行边界完成收口，其中远程仓库同步、文档翻译 freshness、国际化字段治理与重复代码复用为本轮高优先级上收项。

### 1. 主线：远程仓库同步（Hexo 风格 / GitHub / Gitee）能力评估与候选落地 (P1)

- [x] **完成 GitHub / Gitee 单仓库同步候选闭环**
    - 验收: 先完成一份专项设计 / 评估文档，明确同步方向（单向导出 / 双向同步）、Hexo 目录结构、Front-matter 契约、媒体引用策略、认证方式（Token / SSH）、冲突策略、审计边界与回滚方式。
    - 验收: 首轮候选落地只允许收敛到“已发布文章 -> Hexo 风格 Markdown + Front-matter + 媒体引用 -> 单仓库推送”这一条最小闭环，不得在本阶段扩写为桌面端同步、双向合并、定时任务编排或新的通用 Git 发布平台。
    - 验收: 至少完成 GitHub / Gitee 两类远端的契约评估，并落地一条可复验的候选链路；若只先接通一类 provider，另一类必须保留明确的契约差异、阻塞点与后续落地条件。
    - 验收: 补齐最小验证矩阵，至少覆盖导出结果结构、Front-matter 字段映射、媒体路径策略、认证失败 / 推送失败兜底与审计日志落点。
    - 结果: 已完成专项设计文档 [hexo-repository-sync.md](../design/governance/hexo-repository-sync.md)，并落地 `server/services/post-hexo-repository-sync.ts`、`POST /api/admin/posts/:id/hexo-repository-sync` 与分发摘要 `hexoRepositorySync` 派生状态。当前已支持将已发布文章导出为 Hexo 风格 Markdown，改写站内媒体为绝对 URL，并通过 GitHub / Gitee Contents API 推送到单仓库指定目录，同时把最近一次同步状态回写到文章元数据。
    - 验证: 详细记录见 [current.md](../reports/regression/current.md) 的 2026-04-21“远程仓库同步（Hexo 风格）候选链路收口”条目，Review Gate 结论为 `Pass`。

### 2. 主线：文档翻译 freshness 清偿与文档翻译治理 (P0)

- [x] **完成翻译 freshness 首轮清偿与 tier 化治理收口**
    - 验收: 对当前承诺维护的翻译页完成一轮 freshness 清偿，优先覆盖首页、快速开始、部署、翻译治理，以及 `planning` / `documentation` / `security` / `testing` 等高频规范页，不允许只更新 `last_sync` 而不校正文案。
    - 验收: `pnpm docs:check:source-of-truth` 必须恢复为可通过状态；若决定缩减某类翻译承诺范围，必须同步更新文档规范、目录范围与对应翻译页，而不是通过忽略告警绕过事实源检查。
    - 验收: 明确翻译页分层治理口径，区分“必须同步”“允许摘要同步”“默认只保留中文原文”三类范围，并把残余存量债写回规范或 backlog，而不是留作隐性尾项。
    - 验收: 输出本轮已同步范围、暂缓范围、剩余风险与下一轮清偿顺序，作为后续文档治理基线。
    - 结果: 已完成文档翻译 tier 化治理设计与脚本收口，正式固化 `must-sync / summary-sync / source-only` 三层口径；`pnpm docs:check:source-of-truth`、`pnpm docs:check:i18n` 与 `pnpm lint:md` 均已通过。已同步 `en-US` 高频入口与核心规范摘要页，以及 `zh-TW` / `ko-KR` / `ja-JP` 的公共入口页；深层 design / guide / standards 页则按新规则降级为 `source-only` 并显式回链中文事实源。
    - 验证: 详细记录见 [current.md](../reports/regression/current.md) 的 2026-04-21“文档翻译 freshness 清偿与文档翻译治理”条目，Review Gate 结论为 `Pass`。

### 3. 主线：国际化字段治理 (P1)

- [x] **完成 missing blocker、运行时加载边界与共享字段准入口径收口**
    - 验收: 本轮至少明确一组高频模块的 missing blocker 与运行时加载治理边界，优先覆盖 `admin-settings`、`admin-ai`、`admin-snippets`、`admin-friend-links` 与公开页装配链路，不得回退为散点补词。
    - 验收: 明确共享组件文案上收的准入标准，区分页面私有 key、模块级共享 key 与 `common` 级公共文案，避免再次出现跨页面复用后命名空间漂移。
    - 验收: 至少补齐一轮 `i18n:audit:missing`、运行时命中验证与必要的 parity 检查，并形成“哪些入口失败即 blocker”的固定矩阵。
    - 验收: 明确本轮处理模块、未覆盖模块、raw key 风险与后续分批清偿顺序，便于 Review Gate 判定是否达标。
    - 结果: 已固化 `missing` blocker、运行时加载边界与共享 key 准入口径；当前 `i18n:audit:missing` 为 `0`，`i18n:verify:runtime` 与定向 parity 已通过，并把友链公开页 / 后台页共享字段标签统一上收到 `components.friend_links.fields`。
    - 验证: 详细记录见 [current.md](../reports/regression/current.md) 的 2026-04-21“国际化字段治理关闭复核”条目，Review Gate 结论为 `Pass`。

### 4. 主线：重复代码与纯函数复用治理 (P1)

- [x] **完成两轮高收益重复区收口并保住重复代码基线**
    - 验收: 只处理 `1 - 2` 组高收益重复区，优先围绕公共页模板片段、列表型查询 helper、查询参数归一化与读模型组装边界推进，不得扩写为全仓重构。
    - 验收: 每组切片都必须给出原始重复点、拟抽象边界、复用收益、潜在过度泛化风险与回滚方式，而不是只写“继续复用”。
    - 验收: 至少保住重复代码基线不反弹，并输出本轮收敛后的剩余热点列表，作为下一轮切片入口。
    - 验收: 补齐最小验证矩阵，确认共享 helper / 纯函数抽象不会改变公开页、查询参数解析与读模型装配行为。
    - 结果: 已完成两轮窄边界切片，覆盖 AI 管理任务读模型装配共享 helper、后台分页 query `safeParse + 默认回退` 模板，以及公开文章列表 locale fallback 过滤 helper；`pnpm duplicate-code:check` 最新为 `33 clones / 830 duplicated lines / 0.70%`，低于 baseline 容差。
    - 验证: 详细记录见 [current.md](../reports/regression/current.md) 的 2026-04-21“重复代码与纯函数复用治理首轮切片”与“重复代码与纯函数复用治理第二轮收口”条目，两轮 Review Gate 结论均为 `Pass`。

### 5. 主线：存量代码注释治理与注释漂移治理 (P1)

- [x] **完成首轮高复杂度链路注释治理与漂移复核**
    - 验收: 首轮只允许选择 `1 - 2` 组高复杂度链路推进，优先覆盖设置来源判定、locale 归一化、鉴权上下文挂载、上传存储解析、文章访问控制或 AI 服务治理，不得扩成全仓平均补注释工程。
    - 验收: 每组链路都必须同时补“为什么这样写 / 边界条件 / 副作用或契约”类高价值注释，并清理失效、误导性或逐行复述代码的低价值注释，不能只做加法。
    - 验收: 导出函数、跨层契约与复杂分支的注释补齐后，需明确记录已覆盖范围、仍未覆盖边界与注释漂移风险，便于后续继续切片。
    - 验收: 至少完成一轮针对受影响文件的 review，自检“注释是否准确、是否过量、是否与实现同步”，不接受只凭主观感觉判定完成。
    - 结果: 已完成候选组 A 的首轮注释治理，覆盖 `server/services/setting.ts`、`server/utils/locale.ts`、`server/middleware/1-auth.ts` 与 `server/middleware/i18n.ts`；本轮补齐了设置来源优先级、locale 归一化边界，以及 `/api/auth` 固定准入、公开接口会话痕迹准入与 i18n 白名单跳过的请求上下文契约说明，并清理了复述型旧注释。收口阶段已补充函数级 JSDoc 保留策略与模板，明确导出函数、复用函数与复杂函数优先保留简短 JSDoc。
    - 验证: 详细记录见 [current.md](../reports/regression/current.md) 的 2026-04-21“存量代码注释治理与注释漂移治理首轮切片”条目，Review Gate 结论为 `Pass`。

### 6. 主线：ESLint / 类型债与规则收紧治理 (P1)

- [x] **完成两轮 `no-explicit-any` 窄边界收紧与下一轮采样定位**
    - 验收: 本轮仍只允许选择 `1 - 2` 条命中有限、回滚边界清晰的高 ROI 规则推进，不直接扩写到 `no-unsafe-*`、全仓 `any` 清零或大规模样式迁移。
    - 验收: 在进入实现前，必须先给出候选规则命中清单、影响文件、预期收益、回滚方式与最小验证矩阵；若命中过广或回滚边界不清晰，必须退回 backlog 重新切片。
    - 验收: 对受影响文件同步处理 warning / 类型债，并明确哪些属于本轮收口范围、哪些仍为后续债务，不允许借“顺手修一修”把执行面继续膨胀。
    - 验收: 输出本轮规则上收结论、残余债务清单与下一轮候选规则建议，便于阶段收口与后续准入复用。
    - 结果: 已完成两轮 `@typescript-eslint/no-explicit-any` 窄边界收紧，覆盖 `utils/shared/markdown.ts` 的 `7` 处显式 `any` 与 `server/utils/object.ts`、`server/utils/pagination.ts` 的 `2` 处显式 `any`；同时已完成 `@typescript-eslint/no-non-null-assertion` 在 `server / composables / 前端表单` 三桶采样，并明确下一轮优先从 `composables` 继续缩窄。
    - 验证: 详细记录见 [2026-04-18-to-2026-04-21.md](../reports/regression/archive/2026-04-18-to-2026-04-21.md) 的 2026-04-21“utils/shared ESLint / 类型债窄边界收紧”条目与 [current.md](../reports/regression/current.md) 的 2026-04-21“server/utils ESLint / 类型债第二轮收紧”条目，两轮 Review Gate 结论均为 `Pass`。
