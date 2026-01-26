# 墨梅 (Momei) 待办事项 (Todo List)

本文档列出了当前阶段 (MVP) 需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

## 状态说明

- [ ] 待办 (Todo)
- [x] 已完成 (Done)
- [-] 已取消 (Cancelled)

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

## 第二阶段：优化与增强 (Optimization & Enhancement)

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
    - [x] 验收: **安全与速率控制**: 升级搜索接口速率限制为 20 req/min，处理 SQL 注入风险。
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
    - [x] **聚合逻辑优化 (Future Optimization)**: 在聚合展示时，默认版本应优先匹配当前管理后台的“内容语言”或“界面语言”，而非简单的 ID 最小版本。
- [x] **关联标识优化 (Future Optimization)**: 研究将 `translationId` 从随机/雪花 ID 优化为复用“别名 (Slug)”。别名更具可读性且有意义，在保证唯一性的前提下，使用“原始版本别名”作为簇标识可提升管理直观性。

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
    - [-] 验收: 集成 DeepL API 作为高性能翻译选项（延后至第三阶段）。
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
    - 目标: 确保用户自定义的主题样式（如背景色、字体）能稳定覆盖组件内层级较高的默认样式，而无需大量回归到 `!important`。
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
    - [ ] 验收: 仪表盘实现“快速采集”组件，支持闪念胶囊式快捷输入，并支持单一/聚合转文章大纲工作流。
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
    - 验收: 提供“论点扩充”功能，辅助作者挖掘每个章节的深度。

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
